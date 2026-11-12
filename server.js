// Grupo Secreto - Server Abasthan - Sirve App.tsx + estáticos
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const ADMIN_KEY = process.env.ADMIN_KEY || '';

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.tsx': 'text/javascript',
  '.ts': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp'
};

const server = http.createServer((req,res)=>{
  let file = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  let p = path.join(__dirname, file);
  if(!fs.existsSync(p)){
    // Si no existe, devuelve index.html para que React no se rompa
    p = path.join(__dirname, 'index.html');
  }
  const ext = path.extname(p);
  res.writeHead(200, {'Content-Type': TYPES[ext] || 'text/plain'});
  fs.createReadStream(p).pipe(res);
});

server.listen(PORT, '0.0.0.0', ()=>{
  console.log('Grupo Secreto LIVE en '+PORT+' - ADMIN_KEY: '+(ADMIN_KEY ? 'SI' : 'NO - ponlo en Abasthan'));
});
