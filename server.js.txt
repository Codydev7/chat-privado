
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static(__dirname));
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir,{recursive:true});
const storage = multer.diskStorage({
  destination: (req,file,cb)=>cb(null,'uploads/'),
  filename: (req,file,cb)=>cb(null,Date.now()+'-'+file.originalname.replace(/[^a-zA-Z0-9.\-_]/g,'_'))
});
const upload = multer({storage, limits:{fileSize:30*1024*1024}});
app.post('/upload', upload.single('file'), (req,res)=>{
  if(!req.file) return res.status(400).json({success:false});
  res.json({success:true,file:'/uploads/'+req.file.filename});
});
app.use('/uploads', express.static('uploads'));
app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.get('/health',(req,res)=>res.send('OK'));
app.get('/healthz',(req,res)=>res.send('OK'));
const server = http.createServer(app);
const wss = new WebSocket.Server({server});
const clients = new Map();
let messageHistory=[];
wss.on('connection',(ws)=>{
  let currentUser=null;
  ws.on('message',(data)=>{
    try{
      const msg=JSON.parse(data);
      if(msg.type==='presence'){
        currentUser=msg.sender;
        clients.set(currentUser,ws);
        ws.send(JSON.stringify({type:'history',messages:messageHistory}));
        broadcast({type:'presence',users:Array.from(clients.keys())});
        return;
      }
      if(msg.type==='message'){
        msg.message.id=msg.message.id||Date.now().toString();
        msg.message.timestamp=Date.now();
        messageHistory.push(msg.message);
        if(messageHistory.length>1000) messageHistory.shift();
        broadcast({type:'message',message:msg.message});
        return;
      }
      if(msg.type==='typing'){
        broadcastExcept({type:'typing',sender:msg.sender,isTyping:msg.isTyping},ws);
        return;
      }
      if(msg.type==='status'){
        broadcast({type:'status',id:msg.id,status:msg.status,sender:msg.sender});
        const m=messageHistory.find(x=>x.id===msg.id);
        if(m) m.status=msg.status;
        return;
      }
      if(msg.type==='read-all'){
        messageHistory.forEach(m=>{
          if(m.sender!==msg.sender){
            broadcast({type:'status',id:m.id,status:'read',sender:msg.sender});
            m.status='read';
          }
        });
        return;
      }
      if(msg.type==='delete-message'||msg.type==='delete'){
        messageHistory=messageHistory.filter(m=>m.id!==msg.id);
        broadcast({type:'delete-message',id:msg.id});
        return;
      }
      const relay=['remote-audio-request','remote-audio-granted','remote-audio-start','remote-audio-stop','webrtc-offer','webrtc-answer','webrtc-ice','remote-audio-offer','remote-audio-answer','remote-audio-ice'];
      if(relay.includes(msg.type)){
        const target=msg.target;
        if(!target) return;
        if(target==='ALL'){
          broadcastExcept({...msg,from:currentUser},ws);
        } else {
          const tWs=clients.get(target);
          if(tWs && tWs.readyState===1){
            tWs.send(JSON.stringify({...msg,from:currentUser}));
          } else {
            ws.send(JSON.stringify({type:'error',message:'User '+target+' no online. Online: '+Array.from(clients.keys()).join(', ')}));
          }
        }
        return;
      }
    }catch(e){console.error(e);}
  });
  ws.on('close',()=>{
    if(currentUser){
      clients.delete(currentUser);
      broadcast({type:'presence',users:Array.from(clients.keys())});
    }
  });
});
function broadcast(d){ const s=JSON.stringify(d); wss.clients.forEach(c=>{ if(c.readyState===1) c.send(s); }); }
function broadcastExcept(d,ex){ const s=JSON.stringify(d); wss.clients.forEach(c=>{ if(c.readyState===1 && c!==ex) c.send(s); }); }
server.listen(PORT,()=>console.log('LIVE '+PORT));
