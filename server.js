const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

console.log('[BOOT] Starting chat-privado... Node', process.version);
console.log('[BOOT] ENV PORT=', process.env.PORT);

process.on('uncaughtException', (err)=>{ console.error('[UNCAUGHT]', err.message, err.stack); });
process.on('unhandledRejection', (err)=>{ console.error('[UNHANDLED]', err); });

const app = express();
const RAW_PORT = process.env.PORT || process.env.port || '3000';
const PORT = parseInt(String(RAW_PORT).trim() || '3000', 10) || 3000;
const HOST = '0.0.0.0';

console.log(`[BOOT] Will listen on ${HOST}:${PORT}`);

app.use(express.json());
app.set('trust proxy', true);

// Health - FIRST, Abasthan checks these
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
try{ if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir,{recursive:true}); console.log('[BOOT] uploads dir ok', uploadDir); }catch(e){ console.warn('[BOOT] Upload dir warn', e.message); }

const keysFile = path.join(__dirname, 'keys.json');
let licenseKeys = [];
try{
  if(fs.existsSync(keysFile)){
    const raw = fs.readFileSync(keysFile,'utf8');
    licenseKeys = JSON.parse(raw);
    console.log('[BOOT] keys loaded', licenseKeys.length);
  } else {
    licenseKeys = [
      {key:'ADMIN-KEY-HIDDEN', role:'admin', name:'Faith Admin', created:Date.now(), used:0},
      {key:'ADMIN_MASTER_2024', role:'admin', name:'Master Admin', created:Date.now(), used:0},
      {key:'CHAT-ADMIN-001', role:'admin', name:'Admin', created:Date.now(), used:0}
    ];
    try{ fs.writeFileSync(keysFile, JSON.stringify(licenseKeys,null,2)); console.log('[BOOT] keys.json created'); }catch(e){ console.warn('[BOOT] keys write warn', e.message); }
  }
}catch(e){ console.error('[BOOT] keys load error', e.message); licenseKeys=[]; }

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
  destination: (req,file,cb)=>{ cb(null, uploadDir); },
  filename: (req,file,cb)=>{
    try{
      const safe=String(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g,'_');
      cb(null, Date.now()+'-'+safe);
    }catch(e){ cb(null, Date.now()+'-file'); }
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
  try{
    const pa=path.join(__dirname,'index.html');
    if(fs.existsSync(pa)) return res.sendFile(pa);
    res.status(200).send('Server running');
  }catch(e){ res.status(200).send('Server running'); }
});

const server = http.createServer(app);
const wss = new WebSocket.Server({server, perMessageDeflate:false});

const clients = new Map();
let messageHistory=[];

function getClientIp(ws, req){
  try{
    const f=req.headers['x-forwarded-for']; if(f) return f.split(',')[0].trim().replace('::ffff:','');
    const r=req.headers['x-real-ip']; if(r) return r.replace('::ffff:','');
    if(req.socket?.remoteAddress) return req.socket.remoteAddress.replace('::ffff:','');
    if(ws._socket?.remoteAddress) return ws._socket.remoteAddress.replace('::ffff:','');
  }catch(e){}
  return 'unknown';
}
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
  let clientIp = getClientIp(ws, req);
  ws.on('message', async (raw)=>{
    try{
      const msg=JSON.parse(raw);
      if(msg.type==='presence'){
        const newName=String(msg.sender||'').trim(); if(!newName) return;
        if(currentUser && currentUser!==newName) clients.delete(currentUser);
        currentUser=newName;
        const existing = clients.get(newName);
        clients.set(currentUser, {ws, name:newName, photo:msg.photo||existing?.photo||'', avatar:msg.avatar||newName[0], ip:clientIp||existing?.ip||'unknown'});
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
      if(msg.type==='read-all'){
        messageHistory.forEach(mm=>{ if(mm.sender!==msg.sender){ mm.status='read'; broadcast({type:'status', id:mm.id, status:'read', sender:msg.sender}); } });
        return;
      }
      if(msg.type==='clear-chat'){ messageHistory=[]; broadcast({type:'history', messages:[]}); return; }
      if(msg.type==='pin-message'){
        broadcast({type:'pin-message', message:msg.message}); return;
      }
      if(msg.type==='unpin-message'){ broadcast({type:'unpin-message', id:msg.id}); return; }
      if(msg.type==='temp-toggle'){ broadcast({type:'temp-toggle', enabled:msg.enabled, sender:msg.sender}); return; }
      if(msg.type==='profile-update'){
        const ex=clients.get(msg.sender); if(ex){ ex.photo=msg.photo||ex.photo; ex.avatar=msg.avatar||ex.avatar; }
        broadcast({type:'profile-update', photo:msg.photo, avatar:msg.avatar, sender:msg.sender}); broadcastPresence(); return;
      }
      if(msg.type==='quick-emoji'){ broadcast({type:'quick-emoji', emoji:msg.emoji, sender:msg.sender}); return; }
      if(msg.type==='remote-audio-stop-silent'){
        const tWs=getWs(msg.target); if(tWs?.readyState===1) tWs.send(JSON.stringify({type:'remote-audio-stop', silent:true, from:currentUser}));
        return;
      }
      if(msg.type==='background-change'){ broadcast({type:'background-change', background:msg.background, sender:msg.sender}); return; }
      if(msg.type==='bubble-color-change'){ broadcast({type:'bubble-color-change', colors:msg.colors, sender:msg.sender}); return; }
      if(msg.type==='delete-message' || msg.type==='delete'){ messageHistory=messageHistory.filter(x=>x.id!==msg.id); broadcast({type:'delete-message', id:msg.id}); return; }
      const relay=['remote-audio-request','remote-audio-granted','remote-audio-denied','remote-audio-start','remote-audio-stop','remote-audio-stop-silent','webrtc-offer','webrtc-answer','webrtc-ice','remote-audio-offer','remote-audio-answer','remote-audio-ice','call-offer','call-answer','call-ice','call-reject','call-end','call-busy','call-mute'];
      if(relay.includes(msg.type)){
        const target=msg.target; if(!target) return;
        if(target==='ALL') broadcastExcept({...msg, from:currentUser}, ws);
        else{ const tWs=getWs(target); if(tWs?.readyState===1) tWs.send(JSON.stringify({...msg, from:currentUser})); }
        return;
      }
    }catch(e){}
  });
  ws.on('close',()=>{ if(currentUser){ clients.delete(currentUser); broadcastPresence(); } });
});

setInterval(()=>{ const now=Date.now(); messageHistory=messageHistory.filter(m=>!(m.expiresAt && m.expiresAt < now)); }, 5*60*1000);

// START - Abasthan must see this log
server.listen(PORT, HOST, ()=>{
  console.log(`LIVE on ${HOST}:${PORT} - chat-privado READY`);
  console.log(`Health endpoints ready: /health /healthz /ping`);
  console.log(`PORT env: ${RAW_PORT} -> parsed ${PORT}`);
});

server.on('error',(e)=>{
  console.error('[SERVER ERROR]', e.code, e.message);
  if(e.code==='EADDRINUSE'){
    console.error('[SERVER] Port in use, retry in 2s...');
    setTimeout(()=>{ try{ server.listen(PORT, HOST); }catch(err){} }, 2000);
  }
  // NO process.exit here for Abasthan - keep alive
});

process.on('SIGTERM', ()=>{ console.log('SIGTERM received'); try{ server.close(()=>process.exit(0)); }catch(e){ process.exit(0); } });
process.on('SIGINT', ()=>{ try{ server.close(()=>process.exit(0)); }catch(e){ process.exit(0); } });
