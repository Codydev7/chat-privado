const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check para Abasthan - DEBE responder 200 rápido
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Servir archivos estáticos (index.html, etc)
app.use(express.static(__dirname, {
  index: 'index.html'
}));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Chat server running - index.html not found yet');
    }
  });
});

// Crear server HTTP
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocket.Server({ server, path: '/' });

const clients = new Map();
let messageHistory = [];

wss.on('connection', (ws, req) => {
  let currentUser = null;
  console.log('New WS connection from', req.socket.remoteAddress);

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      
      if (msg.type === 'presence') {
        currentUser = msg.sender;
        clients.set(currentUser, ws);
        console.log(`[PRESENCE] ${currentUser} online - total ${clients.size}`);
        ws.send(JSON.stringify({ type: 'history', messages: messageHistory }));
        // Broadcast users list
        const users = Array.from(clients.keys());
        const payload = JSON.stringify({ type: 'presence', users });
        wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(payload); });
        return;
      }

      if (msg.type === 'message') {
        const chatMsg = msg.message;
        chatMsg.id = chatMsg.id || Date.now().toString();
        chatMsg.timestamp = Date.now();
        messageHistory.push(chatMsg);
        if (messageHistory.length > 500) messageHistory.shift();
        const payload = JSON.stringify({ type: 'message', message: chatMsg });
        wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(payload); });
        return;
      }

      if (msg.type === 'status' || msg.type === 'delete' || msg.type === 'pin' || msg.type === 'unpin' || msg.type.startsWith('remote-audio')) {
        // Reenviar a todos o al target
        const target = msg.target;
        if (target && msg.type.includes('remote-audio')) {
          const targetWs = clients.get(target);
          if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            const payload = JSON.stringify({ ...msg, from: currentUser });
            targetWs.send(payload);
          }
          // Si es ALL, broadcast
          if (target === 'ALL') {
            const payload = JSON.stringify({ ...msg, from: currentUser });
            wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(payload); });
          }
        } else {
          const payload = JSON.stringify(msg);
          wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(payload); });
        }
        return;
      }

    } catch (e) {
      console.error('WS message error:', e);
    }
  });

  ws.on('close', () => {
    if (currentUser) {
      clients.delete(currentUser);
      console.log(`[DISCONNECT] ${currentUser} - remaining ${clients.size}`);
      const users = Array.from(clients.keys());
      const payload = JSON.stringify({ type: 'presence', users });
      wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(payload); });
    }
  });

  ws.on('error', (err) => {
    console.error('WS error:', err);
  });
});

// IMPORTANTE: Escuchar en 0.0.0.0 para que Abasthan detecte el puerto
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Chat server corriendo en 0.0.0.0:${PORT}`);
  console.log(`📁 Dir: ${__dirname}`);
  console.log(`🔑 Admin KEY: FAITH-ADMIN-2026`);
  console.log(`🏥 Health check: /health`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});
