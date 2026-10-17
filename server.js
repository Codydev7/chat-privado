
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.text({type: 'text/plain'}));
app.use(express.static(__dirname));

// Asegurar que existen archivos
if (!fs.existsSync('keys.json')) fs.writeFileSync('keys.json', '[]');
if (!fs.existsSync('videos_enc.txt')) fs.writeFileSync('videos_enc.txt', '');

// API Keys
app.get('/api/keys.json', (req, res) => {
  try {
    const data = fs.readFileSync('keys.json', 'utf8') || '[]';
    res.json(JSON.parse(data));
  } catch(e){ res.json([]); }
});

app.post('/api/keys.json', (req, res) => {
  try {
    let keys = JSON.parse(fs.readFileSync('keys.json','utf8')||'[]');
    keys.push(req.body);
    fs.writeFileSync('keys.json', JSON.stringify(keys, null, 2));
    res.json({ok:true});
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.patch('/api/keys.json', (req, res) => {
  try {
    let keys = JSON.parse(fs.readFileSync('keys.json','utf8')||'[]');
    const {key_hash, key, activo} = req.body;
    const target = key_hash || (key ? require('crypto').createHash('sha256').update(key).digest('hex') : null);
    // soporta ambos
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

// API Videos
app.get('/api/videos_enc.json', (req, res) => {
  try {
    const enc = fs.readFileSync('videos_enc.txt','utf8') || '';
    if(!enc) return res.status(404).send('No hay videos');
    res.send(enc);
  } catch(e){ res.status(404).send(''); }
});

app.post('/api/videos_enc.json', (req, res) => {
  try {
    const data = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    fs.writeFileSync('videos_enc.txt', data);
    res.json({ok:true});
  } catch(e){ res.status(500).json({error:e.message}); }
});

// Master key para auto-desbloqueo
if (!fs.existsSync('master_enc.txt')) fs.writeFileSync('master_enc.txt', '');
app.get('/api/master_key', (req,res)=>{
  try{
    const data = fs.readFileSync('master_enc.txt','utf8') || '';
    if(!data) return res.status(404).send('');
    res.send(data);
  }catch(e){ res.status(404).send(''); }
});
app.post('/api/master_key', (req,res)=>{
  try{
    const data = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    fs.writeFileSync('master_enc.txt', data);
    res.json({ok:true});
  }catch(e){ res.status(500).json({error:e.message}); }
});

// Rutas principales
app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'index.html')));
app.get('/admin', (req,res)=> res.sendFile(path.join(__dirname,'admin.html')));

app.listen(PORT, ()=> console.log(`Vault corriendo en puerto ${PORT}`));
