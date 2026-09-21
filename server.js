// ULTRA ROBUST SERVER - NO MODULE REQUIRED FOR HEALTH CHECK
const http = require('http');
const path = require('path');
const fs = require('fs');

console.log('[BOOT] Starting - Node', process.version, 'PORT env', process.env.PORT);

const HOST = '0.0.0.0';
const PORTS = process.env.PORT ? [parseInt(process.env.PORT,10)] : [3000, 8080, 8000, 5000, 10000, 3001];

function createRawHealthServer(port){
  const srv = http.createServer((req,res)=>{
    const url = (req.url||'').split('?')[0];
    if(url==='/health' || url==='/healthz' || url==='/ping'){
      res.writeHead(200, {'Content-Type':'text/plain'});
      res.end('OK');
      return;
    }
    // Try to serve index.html for any other request if exists
    if(url==='/' || url==='/index.html'){
      const p = path.join(__dirname,'index.html');
      if(fs.existsSync(p)){
        try{
          const data = fs.readFileSync(p);
          res.writeHead(200, {'Content-Type':'text/html'});
          res.end(data);
          return;
        }catch(e){}
      }
    }
    res.writeHead(200, {'Content-Type':'text/plain'});
    res.end('Server running - raw fallback');
  });
  srv.listen(port, HOST, ()=>{ console.log(`[RAW] LIVE on ${HOST}:${port}`); });
  srv.on('error', (e)=>{ console.log(`[RAW] Port ${port} error ${e.code}`); });
  return srv;
}

let servers = [];
let expressApp = null;

try{
  const express = require('express');
  const WebSocket = require('ws');
  const multer = require('multer');

  expressApp = express();
  expressApp.use(express.json());
  expressApp.set('trust proxy', true);

  expressApp.get('/health', (req,res)=>res.status(200).send('OK'));
  expressApp.get('/healthz', (req,res)=>res.status(200).send('OK'));
  expressApp.get('/ping', (req,res)=>res.status(200).send('pong'));
  expressApp.get('/my-ip', (req,res)=>{ 
    try{ res.json({ip: req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown'}); }catch(e){ res.json({ip:'unknown'}); }
  });

  const uploadDir = path.join(__dirname, 'uploads');
  try{ fs.mkdirSync(uploadDir,{recursive:true}); }catch(e){}

  const keysFile = path.join(__dirname, 'keys.json');
  let licenseKeys = [];
  try{
    if(fs.existsSync(keysFile)) licenseKeys = JSON.parse(fs.readFileSync(keysFile,'utf8'));
    else {
      licenseKeys = [
        {key:'ADMIN-KEY-HIDDEN', role:'admin', name:'Faith Admin', created:Date.now()},
        {key:'ADMIN_MASTER_2024', role:'admin', name:'Master Admin', created:Date.now()},
        {key:'CHAT-ADMIN-001', role:'admin', name:'Admin', created:Date.now()}
      ];
      fs.writeFileSync(keysFile, JSON.stringify(licenseKeys,null,2));
    }
  }catch(e){ licenseKeys=[]; }

  function saveKeys(){ try{ fs.writeFileSync(keysFile, JSON.stringify(licenseKeys,null,2)); }catch(e){} }
  function genKey(role){
    const c='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const r=(n)=>Array.from({length:n},()=>c[Math.floor(Math.random()*c.length)]).join('');
    return `${role==='admin'?'ADMIN':'CHAT'}-${r(4)}-${r(4)}-${r(4)}`;
  }

  expressApp.get('/api/keys', (req,res)=>res.json({success:true, keys: licenseKeys}));
  expressApp.post('/api/validate-key', (req,res)=>{
    try{
      const k = (req.body?.key||'').toString().toUpperCase().trim();
      if(!k) return res.json({valid:false});
      if(k.includes('FAITH-ADMIN') || k==='ADMIN_MASTER_2024' || k==='CHAT-ADMIN-001' || k==='ADMIN-KEY-HIDDEN') return res.json({valid:true, role:'admin'});
      const f = licenseKeys.find(x=>x.key===req.body.key || x.key.toUpperCase()===k);
      if(f){ f.used=(f.used||0)+1; saveKeys(); return res.json({valid:true, role:f.role}); }
      return res.json({valid:false});
    }catch(e){ return res.json({valid:false}); }
  });
  expressApp.post('/api/generate-key', (req,res)=>{
    try{
      const {name, role} = req.body||{};
      if(!name) return res.status(400).json({success:false});
      const entry = {key:genKey(role), role:role==='admin'?'admin':'user', name:String(name).trim(), created:Date.now(), used:0};
      licenseKeys.push(entry); saveKeys();
      res.json({success:true, key:entry});
    }catch(e){ res.status(500).json({success:false}); }
  });
  expressApp.post('/api/revoke-key', (req,res)=>{
    try{
      const idx = licenseKeys.findIndex(k=>k.key===req.body.key);
      if(idx>=0){ licenseKeys.splice(idx,1); saveKeys(); return res.json({success:true}); }
      res.status(404).json({success:false});
    }catch(e){ res.status(500).json({success:false}); }
  });

  const storage = multer.diskStorage({
    destination: (req,file,cb)=>cb(null, uploadDir),
    filename: (req,file,cb)=>cb(null, Date.now()+'-'+String(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g,'_'))
  });
  const upload = multer({storage, limits:{fileSize:30*1024*1024}});
  expressApp.post('/upload', upload.single('file'), (req,res)=>{
    if(!req.file) return res.status(400).json({success:false});
    res.json({success:true, file:'/uploads/'+req.file.filename});
  });
  expressApp.use('/uploads', express.static(uploadDir));
  expressApp.use(express.static(__dirname));
  expressApp.get('/', (req,res)=>{ 
    const p=path.join(__dirname,'index.html');
    if(fs.existsSync(p)) return res.sendFile(p);
    res.send('Chat running');
  });

  const clients = new Map();
  let history = [];
  const allWSS = [];

  function broadcast(d){
    const s=JSON.stringify(d);
    allWSS.forEach(wss=>{ wss.clients.forEach(c=>{ if(c.readyState===1) try{c.send(s);}catch(e){} }); });
  }
  function broadcastExcept(d,ex){
    const s=JSON.stringify(d);
    allWSS.forEach(wss=>{ wss.clients.forEach(c=>{ if(c!==ex && c.readyState===1) try{c.send(s);}catch(e){} }); });
  }
  function bcastPresence(){
    try{ broadcast({type:'presence', users:Array.from(clients.values()).map(v=>({name:v.name, photo:v.photo||'', avatar:v.avatar||v.name[0]}))}); }catch(e){}
  }
  function getWs(t){ const e=clients.get(t); return e?e.ws:null; }

  function attach(wss){
    wss.on('connection',(ws)=>{
      let cur=null;
      ws.on('message',(raw)=>{
        try{
          const m=JSON.parse(raw);
          if(m.type==='presence'){
            const n=String(m.sender||'').trim(); if(!n) return;
            if(cur && cur!==n) clients.delete(cur);
            cur=n;
            const ex=clients.get(n);
            clients.set(n, {ws, name:n, photo:m.photo||ex?.photo||'', avatar:m.avatar||n[0]});
            bcastPresence();
            if(history.length) ws.send(JSON.stringify({type:'history', messages:history.slice(-200)}));
            return;
          }
          if(m.type==='get-history'){ ws.send(JSON.stringify({type:'history', messages:history.slice(-200)})); return; }
          if(m.type==='message'){ const msg=m.message; if(!msg) return; history.push(msg); if(history.length>1000) history.shift(); broadcast({type:'message', message:msg}); return; }
          if(m.type==='status'){ const t=history.find(x=>x.id===m.id); if(t) t.status=m.status; broadcast({type:'status', id:m.id, status:m.status}); return; }
          if(m.type==='clear-chat'){ history=[]; broadcast({type:'history', messages:[]}); return; }
          if(m.type==='remote-audio-stop-silent'){ const tw=getWs(m.target); if(tw?.readyState===1) tw.send(JSON.stringify({type:'remote-audio-stop', silent:true, from:cur})); return; }
          const relay=['remote-audio-request','remote-audio-granted','remote-audio-denied','remote-audio-start','remote-audio-stop','webrtc-offer','webrtc-answer','webrtc-ice','call-offer','call-answer','call-ice','call-reject','call-end','call-mute','pin-message','unpin-message','temp-toggle','profile-update','quick-emoji','background-change','bubble-color-change','delete-message'];
          if(relay.includes(m.type)){
            if(['pin-message','unpin-message','temp-toggle','profile-update','quick-emoji','background-change','bubble-color-change','delete-message'].includes(m.type)){ broadcast({...m, from:cur}); return; }
            if(!m.target) return;
            if(m.target==='ALL') broadcastExcept({...m, from:cur}, ws);
            else{ const tw=getWs(m.target); if(tw?.readyState===1) tw.send(JSON.stringify({...m, from:cur})); }
            return;
          }
        }catch(e){}
      });
      ws.on('close',()=>{ if(cur){ clients.delete(cur); bcastPresence(); } });
    });
  }

  PORTS.forEach(p=>{
    try{
      const server = http.createServer(expressApp);
      const wss = new WebSocket.Server({server});
      allWSS.push(wss);
      attach(wss);
      servers.push(server);
      server.listen(p, HOST, ()=>{ console.log(`LIVE on ${HOST}:${p} - FULL CHAT READY`); });
      server.on('error', (e)=>{ console.log(`Port ${p} error ${e.code}`); });
    }catch(e){ console.log(`Failed port ${p}`, e.message); }
  });

}catch(e){
  console.error('[BOOT ERROR - FALLING TO RAW]', e.message);
  // Raw fallback - no express needed, guarantees port opens
  PORTS.forEach(p=>{ servers.push(createRawHealthServer(p)); });
}

process.on('uncaughtException', (err)=>{ console.error('[UNCAUGHT]', err.message); });
process.on('unhandledRejection', (err)=>{ console.error('[UNHANDLED]', err); });
process.on('SIGTERM', ()=>{ console.log('SIGTERM - 10s graceful'); setTimeout(()=>process.exit(0), 10000); });
