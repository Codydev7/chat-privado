import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;
const ADMIN_KEY = process.env.ADMIN_KEY || '';
console.log('Grupo Secreto LIVE en ' + PORT + ' - ADMIN_KEY: ' + (ADMIN_KEY ? 'SI' : 'NO'));
const DIST = path.join(__dirname, 'dist');
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
http.createServer((req,res)=>{
  let p = req.url.split('?')[0];
  if(p === '/') p = '/index.html';
  let f = path.join(DIST, p);
  if(!fs.existsSync(f)) f = path.join(DIST, 'index.html');
  const ext = path.extname(f);
  res.writeHead(200, {'Content-Type': MIME[ext] || 'text/plain'});
  fs.createReadStream(f).pipe(res);
}).listen(PORT, '0.0.0.0');
