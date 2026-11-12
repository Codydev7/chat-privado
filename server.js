const http = require('http');
const path = require('path');
const fs = require('fs');
const HOST = '0.0.0.0';
const PORTS = process.env.PORT ? [parseInt(process.env.PORT,10)] : [3000,8080,8000,5000,10000,3001];
console.log('[BOOT] CHAT GRUPO V1 - Node', process.version, 'PORT', process.env.PORT);
const DATA_FILE = path.join(__dirname,'data.json');
let DB = { group: [], dms: {}, keys: [] };
try{ if(fs.existsSync(DATA_FILE)) DB=JSON.parse(fs.readFileSync(DATA_FILE,'utf8')); }catch(e){}
if(!DB.keys || !DB.keys.length){
  DB.keys=[
    {key:'GRUPO-2026', role:'admin', name:'Admin Principal', active:true, created:Date.now()},
    {key:'CHAT-ADMIN-001', role:'admin', name:'Admin', active:true, created:Date.now()},
    {key:'ADMIN_MASTER_2024', role:'admin', name:'Master', active:true, created:Date.now()},
    {key:'FAITH-ADMIN-2026', role:'admin', name:'Faith', active:true, created:Date.now()},
    {key:'GRUPO-DURO-1', role:'user', name:'Llave Grupo General', active:true, created:Date.now()},
  ];
}
function save(){ try{ fs.writeFileSync(DATA_FILE, JSON.stringify(DB)); }catch(e){} }
function genKey(role){
  const c='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const r=n=>Array.from({length:n},()=>c[Math.floor(Math.random()*c.length)]).join('');
  return `GRUPO-${r(4)}-${r(4)}`;
}
async function getGeo(ip){
  if(!ip || ip==='::1' || ip==='127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) return {country:'Local', city:'Local', isp:'Local Network', flag:'🏠'};
  try{
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,isp,query`);
    const j = await res.json();
    if(j.status==='success'){
      const flags={DO:'🇩🇴',US:'🇺🇸',MX:'🇲🇽',CO:'🇨🇴',ES:'🇪🇸',PH:'🇵🇭',VE:'🇻🇪',AR:'🇦🇷',CL:'🇨🇱',PE:'🇵🇪',BR:'🇧🇷',EC:'🇪🇨',GT:'🇬🇹',CU:'🇨🇺',PR:'🇵🇷'};
      return {country:j.country||'Unknown', countryCode:j.countryCode||'', city:j.city||'', isp:j.isp||'', flag:flags[j.countryCode]||'🌍', ip:j.query};
    }
  }catch(e){}
  return {country:'Unknown', city:'', isp:'', flag:'🌍', ip};
}
let express, WebSocket, multer;
try{ express=require('express'); WebSocket=require('ws'); multer=require('multer'); }catch(e){ console.log('Deps missing, raw fallback'); }
if(!express){
  PORTS.forEach(p=>{
    http.createServer((req,res)=>{
      if(req.url==='/health'){res.writeHead(200);res.end('OK');return;}
      if(req.url==='/'||req.url==='/index.html'){
        const f=path.join(__dirname,'index.html');
        if(fs.existsSync(f)){res.writeHead(200,{'Content-Type':'text/html'});res.end(fs.readFileSync(f));return;}
      }
      res.writeHead(200);res.end('Server running');
    }).listen(p,HOST,()=>console.log('LIVE RAW',p));
  });
} else {
  const app=express();
  app.use(express.json());
  app.set('trust proxy', true);
  app.get('/health',(req,res)=>res.send('OK'));
  app.get('/healthz',(req,res)=>res.send('OK'));
  app.get('/ping',(req,res)=>res.send('pong'));
  app.post('/api/validate-key',(req,res)=>{
    const k=(req.body?.key||'').toString().toUpperCase().trim();
    if(!k) return res.json({valid:false, reason:'empty'});
    const found=DB.keys.find(x=>x.key.toUpperCase()===k);
    if(!found) return res.json({valid:false, reason:'not-found'});
    if(found.active===false) return res.json({valid:false, reason:'closed', message:'Esta llave está cerrada. El admin cerró el acceso.'});
    return res.json({valid:true, role:found.role, name:found.name});
  });
  app.get('/api/keys',(req,res)=>res.json({success:true, keys:DB.keys}));
  app.post('/api/create-key',(req,res)=>{
    const {name, role} = req.body||{};
    const entry={key:genKey(role), role:role==='admin'?'admin':'user', name:name||'Llave Grupo', active:true, created:Date.now(), used:0};
    DB.keys.push(entry); save(); res.json({success:true, key:entry});
  });
  app.post('/api/toggle-key',(req,res)=>{
    const k=DB.keys.find(x=>x.key===req.body.key);
    if(!k) return res.status(404).json({success:false});
    k.active=!k.active; save(); res.json({success:true, key:k});
  });
  app.post('/api/revoke-key',(req,res)=>{
    const i=DB.keys.findIndex(x=>x.key===req.body.key);
    if(i>=0){ DB.keys.splice(i,1); save(); return res.json({success:true}); }
    res.status(404).json({success:false});
  });
  app.get('/api/my-geo', async (req,res)=>{
    const ip=(req.headers['x-forwarded-for']||'').split(',')[0].trim() || req.ip || '';
    const geo=await getGeo(ip.replace('::ffff:',''));
    res.json({ip, ...geo});
  });
  app.get('/api/history',(req,res)=>res.json({group:DB.group.slice(-500), dms:DB.dms}));
  const uploadDir=path.join(__dirname,'uploads'); try{fs.mkdirSync(uploadDir,{recursive:true});}catch(e){}
  const storage=multer.diskStorage({destination:(req,file,cb)=>cb(null,uploadDir), filename:(req,file,cb)=>cb(null,Date.now()+'-'+String(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g,'_'))});
  const upload=multer({storage, limits:{fileSize:30*1024*1024}});
  app.post('/upload', upload.single('file'), (req,res)=>{ if(!req.file) return res.status(400).json({success:false}); res.json({success:true, file:'/uploads/'+req.file.filename}); });
  app.use('/uploads', express.static(uploadDir));
  app.use(express.static(__dirname));
  app.get('/',(req,res)=>{ const p=path.join(__dirname,'index.html'); if(fs.existsSync(p)) return res.sendFile(p); res.send('Chat Grupo running'); });
  const clients=new Map();
  const allWSS=[];
  function broadcast(d){ const s=JSON.stringify(d); allWSS.forEach(wss=>wss.clients.forEach(c=>{ if(c.readyState===1) try{c.send(s);}catch(e){} })); }
  function broadcastExcept(d,ex){ const s=JSON.stringify(d); allWSS.forEach(wss=>wss.clients.forEach(c=>{ if(c!==ex && c.readyState===1) try{c.send(s);}catch(e){} })); }
  function sendTo(name, d){ const e=clients.get(name); if(e?.ws?.readyState===1) e.ws.send(JSON.stringify(d)); }
  function bcastPresence(){
    const users=Array.from(clients.values()).map(v=>({name:v.name, photo:v.photo||'', avatar:v.avatar||v.name[0], role:v.role||'user', online:true, lastSeen:v.lastSeen}));
    broadcast({type:'presence', users, count:users.length});
    const dmPairs=Object.keys(DB.dms).map(k=>{
      const msgs=DB.dms[k]; const last=msgs[msgs.length-1];
      return {id:k, participants:k.split('__'), count:msgs.length, lastText:last?.text||'[media]', lastFrom:last?.sender, lastAt:last?.at};
    });
    clients.forEach((c)=>{
      if(c.role==='admin' && c.ws.readyState===1) c.ws.send(JSON.stringify({type:'admin-dm-overview', pairs:dmPairs, users: Array.from(clients.values()).map(v=>({name:v.name, country:v.country, city:v.city, flag:v.flag, isp:v.isp, ip:v.ip, role:v.role})) }));
    });
  }
  function dmId(a,b){ return [a,b].sort().join('__'); }
  function attach(wss){
    wss.on('connection',(ws)=>{
      let cur=null;
      ws.on('message', async (raw)=>{
        try{
          const m=JSON.parse(raw);
          if(m.type==='presence'){
            const n=String(m.sender||'').trim(); if(!n) return;
            if(cur && cur!==n) clients.delete(cur);
            cur=n;
            const ex=clients.get(n);
            let geo={country:m.country||ex?.country||'Unknown', city:m.city||ex?.city||'', flag:m.flag||ex?.flag||'🌍', isp:m.isp||ex?.isp||''};
            const ip=(ws._socket?.remoteAddress||'').replace('::ffff:','');
            clients.set(n,{ws, name:n, photo:m.photo||ex?.photo||'', avatar:m.avatar||n[0], role:m.role||ex?.role||'user', country:geo.country, city:geo.city, flag:geo.flag, isp:geo.isp, ip, lastSeen:Date.now()});
            bcastPresence();
            ws.send(JSON.stringify({type:'history', group:DB.group.slice(-300), dms:DB.dms}));
            return;
          }
          if(m.type==='get-history'){ ws.send(JSON.stringify({type:'history', group:DB.group.slice(-300), dms:DB.dms})); return; }
          if(m.type==='message'){
            const msg=m.message; if(!msg) return;
            msg.at=msg.at||Date.now();
            DB.group.push(msg); if(DB.group.length>2000) DB.group.shift(); save();
            broadcast({type:'message', message:msg});
            return;
          }
          if(m.type==='dm'){
            const msg=m.message; if(!msg || !msg.to) return;
            const id=dmId(msg.sender, msg.to);
            if(!DB.dms[id]) DB.dms[id]=[];
            msg.at=msg.at||Date.now();
            DB.dms[id].push(msg); if(DB.dms[id].length>1000) DB.dms[id].shift(); save();
            sendTo(msg.to, {type:'dm', message:msg});
            sendTo(msg.sender, {type:'dm', message:msg});
            clients.forEach((c)=>{
              if(c.role==='admin' && c.name!==msg.sender && c.name!==msg.to && c.ws.readyState===1){
                c.ws.send(JSON.stringify({type:'admin-dm-spy', message:msg, dmId:id}));
              }
            });
            bcastPresence();
            return;
          }
          if(m.type==='delete-message'){
            const {id, scope, dmId:dm} = m;
            if(scope==='group'){
              const idx=DB.group.findIndex(x=>x.id===id);
              if(idx>=0){ DB.group.splice(idx,1); save(); broadcast({type:'message-deleted', id, scope:'group'}); }
            } else if(scope==='dm' && dm && DB.dms[dm]){
              const idx=DB.dms[dm].findIndex(x=>x.id===id);
              if(idx>=0){ DB.dms[dm].splice(idx,1); save(); broadcast({type:'message-deleted', id, scope:'dm', dmId:dm}); }
            }
            return;
          }
          if(m.type==='clear-chat'){ DB.group=[]; save(); broadcast({type:'history', group:[]}); return; }
          if(m.type==='typing'){ broadcastExcept({type:'typing', from:cur, target:m.target||'GROUP'}, ws); return; }
        }catch(e){ console.log('WS err', e.message); }
      });
      ws.on('close',()=>{ if(cur){ clients.delete(cur); bcastPresence(); } });
    });
  }
  PORTS.forEach(p=>{
    try{
      const server=http.createServer(app);
      const wss=new WebSocket.Server({server});
      allWSS.push(wss); attach(wss);
      server.listen(p,HOST,()=>console.log(`LIVE CHAT GRUPO on ${HOST}:${p}`));
      server.on('error',e=>console.log(`Port ${p} error ${e.code}`));
    }catch(e){ console.log('Failed port',p,e.message); }
  });
}
process.on('uncaughtException',e=>console.error('[UNCAUGHT]',e.message));
