
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

app.use(express.json());

app.get('/health', (req,res)=>res.status(200).send('OK'));
app.get('/healthz', (req,res)=>res.status(200).send('OK'));
app.get('/ping', (req,res)=>res.status(200).send('pong'));

const uploadDir = path.join(__dirname, 'uploads');
try{ if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir,{recursive:true}); }catch(e){}

const storage = multer.diskStorage({
  destination: (req,file,cb)=>cb(null,uploadDir),
  filename: (req,file,cb)=>{
    const safe=file.originalname.replace(/[^a-zA-Z0-9.\-_]/g,'_');
    cb(null,Date.now()+'-'+safe);
  }
});
const upload = multer({storage, limits:{fileSize:30*1024*1024}});

app.post('/upload', upload.single('file'), (req,res)=>{
  if(!req.file) return res.status(400).json({success:false});
  res.json({success:true, file:'/uploads/'+req.file.filename});
});

app.use('/uploads', express.static(uploadDir));
app.use(express.static(__dirname));

app.get('/', (req,res)=>{
  const pa=path.join(__dirname,'index.html');
  if(fs.existsSync(pa)) res.sendFile(pa);
  else res.status(200).send('Server running');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({server});

const clients = new Map(); // username -> {ws, photo, avatar, name}
let messageHistory=[];

function broadcast(data){
  const str=JSON.stringify(data);
  wss.clients.forEach(c=>{ if(c.readyState===1) c.send(str); });
}
function broadcastExcept(data,ex){
  const str=JSON.stringify(data);
  wss.clients.forEach(c=>{ if(c!==ex && c.readyState===1) c.send(str); });
}
function broadcastPresence(){
  const users = Array.from(clients.values()).map(v=>({name:v.name, photo:v.photo||'', avatar:v.avatar||v.name[0]}));
  broadcast({type:'presence', users:users});
}
function getWs(target){
  const entry = clients.get(target);
  return entry ? entry.ws : null;
}

wss.on('connection',(ws)=>{
  let currentUser=null;

  ws.on('message', async (raw)=>{
    try{
      const msg=JSON.parse(raw);

      if(msg.type==='presence'){
        const newName=msg.sender?.trim();
        if(!newName) return;
        if(currentUser && currentUser!==newName){
          clients.delete(currentUser);
        }
        currentUser=newName;
        clients.set(currentUser, {
          ws: ws,
          name: newName,
          photo: msg.photo || clients.get(newName)?.photo || '',
          avatar: msg.avatar || newName[0]
        });
        ws.send(JSON.stringify({type:'history', messages:messageHistory}));
        broadcastPresence();
        return;
      }

      if(msg.type==='message'){
        const m=msg.message;
        m.id=m.id||Date.now().toString();
        m.timestamp=Date.now();
        if(!m.status) m.status='sent';
        messageHistory.push(m);
        if(messageHistory.length>1000) messageHistory.shift();
        broadcast({type:'message', message:m});
        return;
      }

      if(msg.type==='typing'){
        broadcastExcept({type:'typing', sender:msg.sender, isTyping:msg.isTyping}, ws);
        return;
      }

      if(msg.type==='status'){
        const targetMsg=messageHistory.find(x=>x.id===msg.id);
        if(targetMsg) targetMsg.status=msg.status;
        broadcast({type:'status', id:msg.id, status:msg.status, sender:msg.sender});
        return;
      }

      if(msg.type==='read-all'){
        messageHistory.forEach(mm=>{
          if(mm.sender!==msg.sender){
            mm.status='read';
            broadcast({type:'status', id:mm.id, status:'read', sender:msg.sender});
          }
        });
        return;
      }

      if(msg.type==='admin-revoke-license'){
        const target=msg.target;
        console.log(`[ADMIN REVOKE] ${target} by ${currentUser}`);
        if(target==='ALL'){
          broadcast({type:'admin-revoke-license', target:'ALL'});
          // close all except admin
          clients.forEach((entry, name)=>{
            if(name!==currentUser){
              try{ entry.ws.close(); }catch(e){}
            }
          });
          clients.clear();
          if(currentUser){
            clients.set(currentUser, {ws, name:currentUser, photo:'', avatar:currentUser[0]});
          }
        } else {
          const tEntry = clients.get(target);
          if(tEntry){
            try{ tEntry.ws.send(JSON.stringify({type:'admin-revoke-license', target:target})); }catch(e){}
            setTimeout(()=>{ try{ tEntry.ws.close(); }catch(e){} },500);
          }
          broadcast({type:'admin-revoke-license', target:target, from:currentUser});
        }
        broadcastPresence();
        return;
      }

      if(msg.type==='delete-message' || msg.type==='delete'){
        messageHistory=messageHistory.filter(x=>x.id!==msg.id);
        broadcast({type:'delete-message', id:msg.id});
        return;
      }

      const relayTypes=[
        'remote-audio-request','remote-audio-granted','remote-audio-start','remote-audio-stop',
        'webrtc-offer','webrtc-answer','webrtc-ice',
        'remote-audio-offer','remote-audio-answer','remote-audio-ice',
        'call-offer','call-answer','call-ice','call-reject','call-end','call-busy','call-audio-chunk','remote-audio-chunk','call-mute'
      ];
      if(relayTypes.includes(msg.type)){
        const target=msg.target;
        if(!target) return;
        if(target==='ALL'){
          broadcastExcept({...msg, from:currentUser}, ws);
        }else{
          const tWs=getWs(target);
          if(tWs && tWs.readyState===1){
            tWs.send(JSON.stringify({...msg, from:currentUser}));
          }else{
            ws.send(JSON.stringify({type:'error', message:`User ${target} not online. Online: ${Array.from(clients.keys()).join(', ')}`}));
          }
        }
        return;
      }

    }catch(e){ console.error('WS error',e); }
  });

  ws.on('close',()=>{
    if(currentUser){
      clients.delete(currentUser);
      broadcastPresence();
    }
  });
});

server.listen(PORT, HOST, ()=>{
  console.log(`LIVE on ${HOST}:${PORT}`);
});
server.on('error',(e)=>{ console.error(e); process.exit(1); });
