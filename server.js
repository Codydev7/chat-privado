
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 CLAVE SECRETA SOLO EN ENV - NUNCA EN GITHUB
// En Abasthan: Settings > Environment Variables > ADMIN_SECRET = tu clave
// Ejemplo: Verzaini2026!UltraSegura-9fK2xQ1
const ADMIN_SECRET = process.env.ADMIN_SECRET;

if(!ADMIN_SECRET){
  console.warn("⚠️  ADMIN_SECRET no configurado en ENV. /admin devolverá 404 hasta que lo configures.");
}

app.use(cors());
app.use(express.json());
app.use(express.text({type: 'text/plain'}));

// Asegurar archivos
if (!fs.existsSync('keys.json')) fs.writeFileSync('keys.json', '[]');
if (!fs.existsSync('videos_enc.txt')) fs.writeFileSync('videos_enc.txt', '');
if (!fs.existsSync('master_enc.txt')) fs.writeFileSync('master_enc.txt', '');

function checkAdmin(req, res, next){
  if(!ADMIN_SECRET) return res.status(404).send('Not found');
  const token = req.headers['x-admin-secret'] || req.query.admin_secret || req.body?.admin_secret;
  if(token === ADMIN_SECRET) return next();
  return res.status(403).json({error:'Forbidden - admin only'});
}

// API Keys - lectura publica para login usuarios
app.get('/api/keys.json', (req, res) => {
  try {
    const data = fs.readFileSync('keys.json', 'utf8') || '[]';
    res.json(JSON.parse(data));
  } catch(e){ res.json([]); }
});

app.post('/api/keys.json', checkAdmin, (req, res) => {
  try {
    let keys = JSON.parse(fs.readFileSync('keys.json','utf8')||'[]');
    const cleanBody = {...req.body};
    delete cleanBody.admin_secret;
    keys.push(cleanBody);
    fs.writeFileSync('keys.json', JSON.stringify(keys, null, 2));
    res.json({ok:true});
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.patch('/api/keys.json', checkAdmin, (req, res) => {
  try {
    let keys = JSON.parse(fs.readFileSync('keys.json','utf8')||'[]');
    const {key_hash, key, activo} = req.body;
    const target = key_hash || (key ? crypto.createHash('sha256').update(key).digest('hex') : null);
    keys = keys.map(k => {
      if (key_hash && k.key_hash === key_hash) return {...k, activo};
      if (key && k.key === key) return {...k, activo};
      if (target && k.key_hash === target) return {...k, activo};
      return k;
    });
    fs.writeFileSync('keys.json', JSON.stringify(keys, null, 2));
    res.json({ok:true});
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/api/videos_enc.json', (req, res) => {
  try {
    const enc = fs.readFileSync('videos_enc.txt','utf8') || '';
    if(!enc) return res.status(404).send('No hay videos');
    res.send(enc);
  } catch(e){ res.status(404).send(''); }
});

app.post('/api/videos_enc.json', checkAdmin, (req, res) => {
  try {
    let data = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    data = data.replace(/"admin_secret":"[^"]+",?/, '');
    fs.writeFileSync('videos_enc.txt', data);
    res.json({ok:true});
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/api/master_key', (req,res)=>{
  try{
    const data = fs.readFileSync('master_enc.txt','utf8') || '';
    if(!data) return res.status(404).send('');
    res.send(data);
  }catch(e){ res.status(404).send(''); }
});
app.post('/api/master_key', checkAdmin, (req,res)=>{
  try{
    const data = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    fs.writeFileSync('master_enc.txt', data);
    res.json({ok:true});
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'index.html')));

// Admin OCULTO: solo con ?admin_secret=ENV_VAR
app.get('/admin', (req,res)=>{
  if(!ADMIN_SECRET || req.query.admin_secret !== ADMIN_SECRET){
    return res.status(404).send('<html><head><title>404</title></head><body><h1>404 Not Found</h1><p>The requested URL /admin was not found on this server.</p></body></html>');
  }
  res.sendFile(path.join(__dirname,'admin.html'));
});

app.get('/verzaini-admin', (req,res)=>{
  if(!ADMIN_SECRET || req.query.admin_secret !== ADMIN_SECRET){
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(__dirname,'admin.html'));
});

app.use(express.static(__dirname));

app.listen(PORT, ()=> console.log(`Vault corriendo en puerto ${PORT} - Admin protegido por ENV`));
