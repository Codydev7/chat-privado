
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

// Health check FIRST - Abasthan needs instant 200
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/healthz', (req, res) => res.status(200).send('OK'));
app.get('/ping', (req, res) => res.status(200).send('pong'));

const uploadDir = path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
} catch (e) {
  console.log('Could not create uploads dir', e.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, Date.now() + '-' + safe);
  }
});
const upload = multer({ storage, limits: { fileSize: 30 * 1024 * 1024 } });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file' });
  res.json({ success: true, file: '/uploads/' + req.file.filename });
});

app.use('/uploads', express.static(uploadDir));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('Chat server running. Missing index.html');
  }
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();
let messageHistory = [];

wss.on('connection', (ws) => {
  let currentUser = null;
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'presence') {
        currentUser = msg.sender;
        clients.set(currentUser, ws);
        ws.send(JSON.stringify({ type: 'history', messages: messageHistory }));
        broadcast({ type: 'presence', users: Array.from(clients.keys()) });
        return;
      }
      if (msg.type === 'message') {
        msg.message.id = msg.message.id || Date.now().toString();
        msg.message.timestamp = Date.now();
        messageHistory.push(msg.message);
        if (messageHistory.length > 1000) messageHistory.shift();
        broadcast({ type: 'message', message: msg.message });
        return;
      }
      if (msg.type === 'typing') {
        broadcastExcept({ type: 'typing', sender: msg.sender, isTyping: msg.isTyping }, ws);
        return;
      }
      if (msg.type === 'status') {
        broadcast({ type: 'status', id: msg.id, status: msg.status, sender: msg.sender });
        const m = messageHistory.find(x => x.id === msg.id);
        if (m) m.status = msg.status;
        return;
      }
      if (msg.type === 'read-all') {
        messageHistory.forEach(m => {
          if (m.sender !== msg.sender) {
            broadcast({ type: 'status', id: m.id, status: 'read', sender: msg.sender });
            m.status = 'read';
          }
        });
        return;
      }
      if (msg.type === 'delete-message' || msg.type === 'delete') {
        messageHistory = messageHistory.filter(m => m.id !== msg.id);
        broadcast({ type: 'delete-message', id: msg.id });
        return;
      }
      const relay = ['remote-audio-request','remote-audio-granted','remote-audio-start','remote-audio-stop','webrtc-offer','webrtc-answer','webrtc-ice','remote-audio-offer','remote-audio-answer','remote-audio-ice'];
      if (relay.includes(msg.type)) {
        const target = msg.target;
        if (!target) return;
        if (target === 'ALL') {
          broadcastExcept({ ...msg, from: currentUser }, ws);
        } else {
          const tWs = clients.get(target);
          if (tWs && tWs.readyState === 1) {
            tWs.send(JSON.stringify({ ...msg, from: currentUser }));
          } else {
            ws.send(JSON.stringify({ type: 'error', message: 'User ' + target + ' not online. Online: ' + Array.from(clients.keys()).join(', ') }));
          }
        }
        return;
      }
    } catch (e) {
      console.error('WS error', e);
    }
  });
  ws.on('close', () => {
    if (currentUser) {
      clients.delete(currentUser);
      broadcast({ type: 'presence', users: Array.from(clients.keys()) });
    }
  });
});

function broadcast(d) {
  const s = JSON.stringify(d);
  wss.clients.forEach(c => { if (c.readyState === 1) c.send(s); });
}
function broadcastExcept(d, ex) {
  const s = JSON.stringify(d);
  wss.clients.forEach(c => { if (c.readyState === 1 && c !== ex) c.send(s); });
}

// IMPORTANT: bind to 0.0.0.0 for Abasthan port detection
server.listen(PORT, HOST, () => {
  console.log(`LIVE on http://${HOST}:${PORT} - PID ${process.pid}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
});
server.on('error', (err) => {
  console.error('Server error', err);
  process.exit(1);
});
