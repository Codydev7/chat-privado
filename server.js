const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health checks - Abasthan requires this to be FAST and 200
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/healthz', (req, res) => res.status(200).send('OK'));

// Main route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'), err => {
    if (err) {
      console.error(err);
      res.status(200).send('Server running - index.html missing');
    }
  });
});

// Serve static files (index.html and others)
app.use(express.static(__dirname));

const server = http.createServer(app);

// WebSocket server WITHOUT path - critical fix for NO_LIVE_PORT
const wss = new WebSocket.Server({ server });

const clients = new Map();
let messageHistory = [];

wss.on('connection', ws => {
  let currentUser = null;
  ws.on('message', data => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'presence') {
        currentUser = msg.sender;
        clients.set(currentUser, ws);
        console.log(`[JOIN] ${currentUser} total ${clients.size}`);
        ws.send(JSON.stringify({ type: 'history', messages: messageHistory }));
        const users = Array.from(clients.keys());
        const payload = JSON.stringify({ type: 'presence', users });
        wss.clients.forEach(c => { if (c.readyState === 1) c.send(payload); });
      } else if (msg.type === 'message') {
        const chatMsg = msg.message;
        chatMsg.id = chatMsg.id || Date.now().toString();
        chatMsg.timestamp = Date.now();
        messageHistory.push(chatMsg);
        if (messageHistory.length > 500) messageHistory.shift();
        const payload = JSON.stringify({ type: 'message', message: chatMsg });
        wss.clients.forEach(c => { if (c.readyState === 1) c.send(payload); });
      } else {
        // status, delete, pin, remote-audio etc - broadcast or target
        const target = msg.target;
        if (target && msg.type && msg.type.includes('remote-audio')) {
          const tWs = clients.get(target);
          if (tWs && tWs.readyState === 1) tWs.send(JSON.stringify({ ...msg, from: currentUser }));
          if (target === 'ALL') {
            wss.clients.forEach(c => { if (c.readyState === 1) c.send(JSON.stringify({ ...msg, from: currentUser })); });
          }
        } else {
          const payload = JSON.stringify(msg);
          wss.clients.forEach(c => { if (c.readyState === 1) c.send(payload); });
        }
      }
    } catch(e){ console.error('WS err', e); }
  });
  ws.on('close', () => {
    if (currentUser) {
      clients.delete(currentUser);
      const users = Array.from(clients.keys());
      const payload = JSON.stringify({ type: 'presence', users });
      wss.clients.forEach(c => { if (c.readyState === 1) c.send(payload); });
    }
  });
});

// CRITICAL: Listen on 0.0.0.0
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ LIVE on 0.0.0.0:${PORT}`);
  console.log(`✅ Health: /health`);
  console.log(`🔑 Admin: FAITH-ADMIN-2026`);
});
