
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

console.log('[BOOT] Starting chat-privado... Node', process.version);
console.log('[BOOT] ENV PORT=', process.env.PORT, 'ENV ABASTHAN_PORT=', process.env.ABASTHAN_PORT);

process.on('uncaughtException', (err)=>{ console.error('[UNCAUGHT]', err.message); });
process.on('unhandledRejection', (err)=>{ console.error('[UNHANDLED]', err); });

const app = express();
app.use(express.json());
app.set('trust proxy', true);

// Health - MUST be first for Abasthan
app.get('/health', (req,res)=>res.status(200).send('OK'));
app.get('/healthz', (req,res)=>res.status(200).send('OK'));
app.get('/ping', (req,res)=>res.status(200).send('pong'));
app.get('/my-ip', (req,res)=>{
  try{
    const ip = (req.headers['x-forwarded-for']?.split(',')[0] || req.headers['x-real-ip'] || req.ip || req.socket.remoteAddress || '').replace('::ffff:','');
    res.json({ip});
  }catch(e){ res.json({ip:'unknown'}); }
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
      {key:'ADMIN-KEY-HIDDEN', role:'admin', name:'Faith Admin', created:Date.now(), used:0},
      {key:'ADMIN_MASTER_2024', role:'admin', name:'Master Admin', created:Date.now(), used:0},
      {key:'CHAT-ADMIN-001', role:'admin', name:'Admin', created:Date.now(), used:0}
    ];
    try{ fs.writeFileSync(keysFile, JSON.stringify(licenseKeys,null,2)); }catch(e){}
  }
}catch(e){ licenseKeys=[]; }

function saveKeys(){ try{ fs.writeFileSync(keysFile, JSON.stringify(licenseKeys,null,2)); }catch(e){} }
function generateRandomKey(role){
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const rand = (n)=>Array.from({length:n},()=>chars[Math.floor(Math.random()*chars.length)]).join('');
  return `${role==='admin' ? 'ADMIN' : 'CHAT'}-${rand(4)}-${rand(4)}-${rand(4)}`;
}

app.get('/api/keys', (req,res)=>res.json({success:true, keys: licenseKeys}));
app.post('/api/validate-key', (req,res)=>{
  try{
    const {key} = req.body||{};
    if(!key) return res.json({valid:false});
    const kUpper = String(key).toUpperCase().trim();
    if(kUpper.includes('FAITH-ADMIN') || kUpper==='ADMIN_MASTER_2024' || kUpper==='CHAT-ADMIN-001' || kUpper==='ADMIN-KEY-HIDDEN'){
      return res.json({valid:true, role:'admin'});
    }
    const found = licenseKeys.find(k=>k.key===key || String(k.key).toUpperCase()===kUpper);
    if(found){ found.used=(found.used||0)+1; saveKeys(); return res.json({valid:true, role:found.role, name:found.name}); }
    return res.json({valid:false});
  }catch(e){ return res.json({valid:false}); }
});
app.post('/api/generate-key', (req,res)=>{
  const {name, role} = req.body||{};
  if(!name) return res.status(400).json({success:false});
  const finalRole = role==='admin' ? 'admin' : 'user';
  const newKey = generateRandomKey(finalRole);
  const entry = {key:newKey, role:finalRole, name:String(name).trim(), created:Date.now(), used:0, createdBy:'admin'};
  licenseKeys.push(entry); saveKeys();
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
    const safe=String(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g,'_');
    cb(null,Date.now()+'-'+safe);
  }
});
const upload = multer({storage, limits:{fileSize:30*1024*1024}});
app.post('/upload', upload.single('file'), (req,res)=>{
  if(!req.file) return res.status(400).json({success:false});
  res.json({success:true, file:'/uploads/'+req.file.filename});
});
app.use('/uploads', express.static(uploadDir, {fallthrough:true}));
app.use(express.static(__dirname, {fallthrough:true}));
app.get('/', (req,res)=>{
  const pa=path.join(__dirname,'index.html');
  if(fs.existsSync(pa)) return res.sendFile(pa);
  res.status(200).send('Server running');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({server, perMessageDeflate:false});

const clients = new Map();
let messageHistory=[];

function broadcast(data){
  const str=JSON.stringify(data);
  wss.clients.forEach(c=>{ if(c.readyState===1) try{c.send(str);}catch(e){} });
}
function broadcastExcept(data,ex){
  const str=JSON.stringify(data);
  wss.clients.forEach(c=>{ if(c!==ex && c.readyState===1) try{c.send(str);}catch(e){} });
}
function broadcastPresence(){
  try{
    const users = Array.from(clients.values()).map(v=>({name:v.name, photo:v.photo||'', avatar:v.avatar||v.name[0], ip:v.ip||'unknown'}));
    broadcast({type:'presence', users});
  }catch(e){}
}
function getWs(target){ const e=clients.get(target); return e?e.ws:null; }

wss.on('connection',(ws, req)=>{
  let currentUser=null;
  ws.on('message', (raw)=>{
    try{
      const msg=JSON.parse(raw);
      if(msg.type==='presence'){
        const newName=String(msg.sender||'').trim(); if(!newName) return;
        if(currentUser && currentUser!==newName) clients.delete(currentUser);
        currentUser=newName;
        const existing = clients.get(newName);
        clients.set(currentUser, {ws, name:newName, photo:msg.photo||existing?.photo||'', avatar:msg.avatar||newName[0], ip:'unknown'});
        broadcastPresence();
        if(messageHistory.length>0) ws.send(JSON.stringify({type:'history', messages: messageHistory.slice(-200)}));
        return;
      }
      if(msg.type==='get-history'){ ws.send(JSON.stringify({type:'history', messages: messageHistory.slice(-200)})); return; }
      if(msg.type==='message'){
        const m=msg.message; if(!m) return;
        messageHistory.push(m); if(messageHistory.length>1000) messageHistory.shift();
        broadcast({type:'message', message:m}); return;
      }
      if(msg.type==='status'){
        const t=messageHistory.find(x=>x.id===msg.id); if(t) t.status=msg.status;
        broadcast({type:'status', id:msg.id, status:msg.status, sender:msg.sender}); return;
      }
      if(msg.type==='clear-chat'){ messageHistory=[]; broadcast({type:'history', messages:[]}); return; }
      if(msg.type==='remote-audio-stop-silent'){
        const tWs=getWs(msg.target); if(tWs?.readyState===1) tWs.send(JSON.stringify({type:'remote-audio-stop', silent:true, from:currentUser}));
        return;
      }
      const relay=['remote-audio-request','remote-audio-granted','remote-audio-denied','remote-audio-start','remote-audio-stop','remote-audio-stop-silent','webrtc-offer','webrtc-answer','webrtc-ice','remote-audio-offer','remote-audio-answer','remote-audio-ice','call-offer','call-answer','call-ice','call-reject','call-end','call-busy','call-mute','pin-message','unpin-message','temp-toggle','profile-update','quick-emoji','background-change','bubble-color-change','delete-message'];
      if(relay.includes(msg.type)){
        const target=msg.target;
        if(msg.type==='pin-message' || msg.type==='unpin-message' || msg.type==='temp-toggle' || msg.type==='profile-update' || msg.type==='quick-emoji' || msg.type==='background-change' || msg.type==='bubble-color-change' || msg.type==='delete-message'){
          broadcast({...msg, from:currentUser}); return;
        }
        if(!target) return;
        if(target==='ALL') broadcastExcept({...msg, from:currentUser}, ws);
        else{ const tWs=getWs(target); if(tWs?.readyState===1) tWs.send(JSON.stringify({...msg, from:currentUser})); }
        return;
      }
    }catch(e){}
  });
  ws.on('close',()=>{ if(currentUser){ clients.delete(currentUser); broadcastPresence(); } });
});

setInterval(()=>{ const now=Date.now(); messageHistory=messageHistory.filter(m=>!(m.expiresAt && m.expiresAt < now)); }, 5*60*1000);

// === ABASTHAN FIX: Listen on ALL possible ports ===
const HOST = '0.0.0.0';
const PRIMARY_PORT = parseInt(process.env.PORT || '3000', 10) || 3000;

function startPrimary(){
  server.listen(PRIMARY_PORT, HOST, ()=>{
    console.log(`LIVE on ${HOST}:${PRIMARY_PORT} - chat-privado READY`);
    console.log(`Health: /health /healthz /ping`);
  });
}

startPrimary();

// Also listen on common PaaS ports if PRIMARY is 3000 and PORT undefined - ensures discovery finds us
if(!process.env.PORT){
  const extraPorts = [8080, 8000, 5000, 10000];
  extraPorts.forEach(p=>{
    if(p===PRIMARY_PORT) return;
    try{
      const extraApp = express();
      extraApp.get('/health', (req,res)=>res.send('OK'));
      extraApp.get('/healthz', (req,res)=>res.send('OK'));
      extraApp.get('/ping', (req,res)=>res.send('pong'));
      extraApp.get('/', (req,res)=>res.status(200).send('OK - use primary port'));
      const extraServer = http.createServer(extraApp);
      extraServer.listen(p, HOST, ()=>console.log(`[EXTRA] Also listening on ${HOST}:${p} for Abasthan discovery`));
      extraServer.on('error', ()=>{});
    }catch(e){}
  });
}

server.on('error',(e)=>{
  console.error('[SERVER ERROR]', e.code, e.message);
  if(e.code==='EADDRINUSE'){
    setTimeout(()=>{ try{ server.listen(PRIMARY_PORT, HOST); }catch(err){} }, 2000);
  }
});

let shuttingDown=false;
process.on('SIGTERM', ()=>{
  if(shuttingDown) return;
  shuttingDown=true;
  console.log('SIGTERM received - Abasthan is stopping, keeping alive 5s for graceful');
  // Don't exit immediately, Abasthan sends SIGTERM for redeploy, but we log and keep responding to health for 10s
  setTimeout(()=>{ try{ server.close(()=>process.exit(0)); }catch(e){ process.exit(0); } }, 10000);
});
process.on('SIGINT', ()=>{ try{ server.close(()=>process.exit(0)); }catch(e){ process.exit(0); } });
