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
app.set('trust proxy', true);

// Health for Abasthan
app.get('/health', (req,res)=>res.status(200).send('OK'));
app.get('/healthz', (req,res)=>res.status(200).send('OK'));
app.get('/ping', (req,res)=>res.status(200).send('pong'));

app.get('/my-ip', (req,res)=>{
  const ip = (req.headers['x-forwarded-for']?.split(',')[0] || req.headers['x-real-ip'] || req.ip || req.socket.remoteAddress || '').replace('::ffff:','');
  res.json({ip});
});

const uploadDir = path.join(__dirname, 'uploads');
try{ if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir,{recursive:true}); }catch(e){}

const keysFile = path.join(__dirname, 'keys.json');
let licenseKeys = [];
try{
  if(fs.existsSync(keysFile)){
    licenseKeys = JSON.parse(fs.readFileSync(keysFile,'utf8'));
  } else {
    licenseKeys = [
      {key:'FAITH-ADMIN-2026', role:'admin', name:'Faith Admin', created:Date.now(), used:0},
      {key:'ADMIN_MASTER_2024', role:'admin', name:'Master Admin', created:Date.now(), used:0},
      {key:'CHAT-ADMIN-001', role:'admin', name:'Admin', created:Date.now(), used:0}
    ];
    fs.writeFileSync(keysFile, JSON.stringify(licenseKeys,null,2));
  }
}catch(e){ console.error('keys load error',e); licenseKeys=[]; }

function saveKeys(){
  try{ fs.writeFileSync(keysFile, JSON.stringify(licenseKeys,null,2)); }catch(e){}
}
function generateRandomKey(role){
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const rand = (n)=>Array.from({length:n},()=>chars[Math.floor(Math.random()*chars.length)]).join('');
  const prefix = role==='admin' ? 'ADMIN' : 'CHAT';
  return `${prefix}-${rand(4)}-${rand(4)}-${rand(4)}`;
}

// === KEYS API - ESTE ES TU KEY GENERATOR ===
app.get('/api/keys', (req,res)=>{
  res.json({success:true, keys: licenseKeys});
});

app.post('/api/validate-key', (req,res)=>{
  const {key} = req.body||{};
  if(!key) return res.json({valid:false});
  const kUpper = key.toUpperCase().trim();
  // Master keys siempre validas
  if(kUpper.includes('FAITH-ADMIN') || kUpper==='ADMIN_MASTER_2024' || kUpper==='CHAT-ADMIN-001'){
    const masterRole = 'admin';
    return res.json({valid:true, role:masterRole});
  }
  const found = licenseKeys.find(k=>k.key===key || k.key.toUpperCase()===kUpper);
  if(found){
    found.used = (found.used||0)+1;
    saveKeys();
    return res.json({valid:true, role:found.role, name:found.name});
  }
  return res.json({valid:false});
});

app.post('/api/generate-key', (req,res)=>{
  const {name, role} = req.body||{};
  if(!name) return res.status(400).json({success:false, error:'Name required'});
  const finalRole = role==='admin' ? 'admin' : 'user';
  const newKey = generateRandomKey(finalRole);
  const entry = {key:newKey, role:finalRole, name:name.trim(), created:Date.now(), used:0, createdBy:'admin'};
  licenseKeys.push(entry);
  saveKeys();
  console.log(`[KEYGEN] ${finalRole} key for ${name}: ${newKey}`);
  res.json({success:true, key:entry});
});

app.post('/api/revoke-key', (req,res)=>{
  const {key} = req.body||{};
  const idx = licenseKeys.findIndex(k=>k.key===key);
  if(idx>=0){ licenseKeys.splice(idx,1); saveKeys(); return res.json({success:true}); }
  res.status(404).json({success:false});
});

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

const clients = new Map();
let messageHistory=[];
let pinnedStore=[];
let chatBackground=null; // Shared background admin<->user
let chatBubbleColors={mine:'#202020', theirs:'#151515'}; // Shared bubble colors

function getClientIp(ws, req){
  try{
    const forwarded = req.headers['x-forwarded-for'];
    if(forwarded) return forwarded.split(',')[0].trim().replace('::ffff:','');
    const real = req.headers['x-real-ip'];
    if(real) return real.replace('::ffff:','');
    if(req.socket && req.socket.remoteAddress) return req.socket.remoteAddress.replace('::ffff:','');
    if(ws._socket && ws._socket.remoteAddress) return ws._socket.remoteAddress.replace('::ffff:','');
  }catch(e){}
  return 'unknown';
}

function broadcast(data){
  const str=JSON.stringify(data);
  wss.clients.forEach(c=>{ if(c.readyState===1) c.send(str); });
}
function broadcastExcept(data,ex){
  const str=JSON.stringify(data);
  wss.clients.forEach(c=>{ if(c!==ex && c.readyState===1) c.send(str); });
}
function broadcastPresence(){
  const users = Array.from(clients.values()).map(v=>({name:v.name, photo:v.photo||'', avatar:v.avatar||v.name[0], ip:v.ip||'unknown'}));
  broadcast({type:'presence', users:users});
}
function getWs(target){
  const entry = clients.get(target);
  return entry ? entry.ws : null;
}

wss.on('connection',(ws, req)=>{
  let currentUser=null;
  let clientIp = getClientIp(ws, req);
  console.log(`[CONNECT] IP ${clientIp}`);

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
        const existing = clients.get(newName);
        clients.set(currentUser, {
          ws: ws,
          name: newName,
          photo: msg.photo || existing?.photo || '',
          avatar: msg.avatar || newName[0],
          ip: clientIp || existing?.ip || 'unknown',
          lastSeen: Date.now()
        });
        ws.send(JSON.stringify({type:'history', messages:messageHistory, pinned:pinnedStore, background:chatBackground, bubbleColors:chatBubbleColors}));
        // Send current background and bubble colors if exists
        if(chatBackground){
          ws.send(JSON.stringify({type:'background-change', background:chatBackground}));
        }
        if(chatBubbleColors){
          ws.send(JSON.stringify({type:'bubble-color-change', colors:chatBubbleColors}));
        }
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

      if(msg.type==='pin-message'){
        const p=msg.message;
        if(!pinnedStore.find(x=>x.id===p.id)){
          pinnedStore.push({id:p.id,text:p.text,sender:p.sender,timestamp:Date.now()});
          if(pinnedStore.length>50) pinnedStore.shift();
          broadcast({type:'pin-message', message:p});
        }
        return;
      }

      if(msg.type==='unpin-message'){
        pinnedStore=pinnedStore.filter(x=>x.id!==msg.id);
        broadcast({type:'unpin-message', id:msg.id});
        return;
      }

      if(msg.type==='temp-toggle'){
        if(!msg.enabled){
          let canceled=0;
          messageHistory.forEach(m=>{
            if(m.expiresAt && m.expiresAt > Date.now()){
              delete m.expiresAt;
              canceled++;
            }
          });
          if(canceled>0) console.log(`[TEMP CANCEL] ${canceled} mensajes salvados por ${msg.sender}`);
        }
        broadcast({type:'temp-toggle', enabled:msg.enabled, sender:msg.sender});
        return;
      }

      if(msg.type==='profile-update'){
        const existing = clients.get(msg.sender);
        if(existing){
          existing.photo = msg.photo || existing.photo;
          existing.avatar = msg.avatar || existing.avatar;
        }
        broadcast({type:'profile-update', photo:msg.photo, avatar:msg.avatar, sender:msg.sender});
        broadcastPresence();
        return;
      }

      if(msg.type==='quick-emoji'){
        broadcast({type:'quick-emoji', emoji:msg.emoji, sender:msg.sender});
        return;
      }

      if(msg.type==='admin-revoke-license'){
        const target=msg.target;
        console.log(`[ADMIN REVOKE] ${target} by ${currentUser} IP ${clientIp}`);
        if(target==='ALL'){
          broadcast({type:'admin-revoke-license', target:'ALL'});
          clients.forEach((entry, name)=>{
            if(name!==currentUser){
              try{ entry.ws.close(); }catch(e){}
            }
          });
          clients.clear();
          if(currentUser){
            clients.set(currentUser, {ws, name:currentUser, photo:'', avatar:currentUser[0], ip:clientIp});
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

      if(msg.type==='background-change'){
        chatBackground=msg.background;
        console.log(`[BG CHANGE] by ${msg.sender}: ${JSON.stringify(chatBackground).substring(0,80)}`);
        broadcast({type:'background-change', background:chatBackground, sender:msg.sender});
        return;
      }

      if(msg.type==='bubble-color-change'){
        chatBubbleColors=msg.colors;
        console.log(`[BUBBLE COLOR CHANGE] by ${msg.sender}: ${JSON.stringify(chatBubbleColors)}`);
        broadcast({type:'bubble-color-change', colors:chatBubbleColors, sender:msg.sender});
        return;
      }

      if(msg.type==='delete-message' || msg.type==='delete'){
        messageHistory=messageHistory.filter(x=>x.id!==msg.id);
        pinnedStore=pinnedStore.filter(x=>x.id!==msg.id);
        broadcast({type:'delete-message', id:msg.id});
        return;
      }

      const relayTypes=[
        'remote-audio-request','remote-audio-granted','remote-audio-denied','remote-audio-start','remote-audio-stop',
        'webrtc-offer','webrtc-answer','webrtc-ice',
        'remote-audio-offer','remote-audio-answer','remote-audio-ice',
        'call-offer','call-answer','call-ice','call-reject','call-end','call-busy','call-audio-chunk','remote-audio-chunk','call-mute','call-mute-status','profile-update'
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

setInterval(()=>{
  const now=Date.now();
  const before=messageHistory.length;
  messageHistory=messageHistory.filter(m=>!(m.expiresAt && m.expiresAt < now));
  if(messageHistory.length!==before){
    console.log(`[CLEAN] Removed ${before-messageHistory.length} expired temp messages`);
  }
}, 5*60*1000);

server.listen(PORT, HOST, ()=>{
  console.log(`LIVE on ${HOST}:${PORT} with IP tracking + pins + temp + keys`);
  console.log(`Master KEY: FAITH-ADMIN-2026`);
  console.log(`Keys API ready: /api/keys, /api/validate-key, /api/generate-key, /api/revoke-key`);
});
server.on('error',(e)=>{ console.error(e); process.exit(1); });
