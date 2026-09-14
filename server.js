const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Crear carpeta uploads si no existe
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer config para fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Endpoint para subir fotos
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file' });
  res.json({ success: true, file: '/uploads/' + req.file.filename });
});

// Servir uploads
app.use('/uploads', express.static('uploads'));

// Ruta principal - servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store clients: username -> ws
const clients = new Map();
let messageHistory = [];
let pinnedMessage = null;

wss.on('connection', (ws) => {
  let currentUser = null;

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data);
      
      // Presence - registro de usuario
      if (msg.type === 'presence') {
        currentUser = msg.sender;
        clients.set(currentUser, ws);
        console.log(`[PRESENCE] ${currentUser} conectado. Total: ${clients.size}`);
        
        // Enviar historial al nuevo usuario
        ws.send(JSON.stringify({ type: 'history', messages: messageHistory }));
        
        // Notificar a todos los usuarios conectados
        broadcastPresence();
        return;
      }

      // Mensaje de chat
      if (msg.type === 'message') {
        const chatMsg = msg.message;
        chatMsg.id = chatMsg.id || Date.now().toString();
        chatMsg.timestamp = Date.now();
        messageHistory.push(chatMsg);
        // Limitar historial a 500 mensajes
        if (messageHistory.length > 500) messageHistory.shift();
        
        console.log(`[MESSAGE] ${chatMsg.sender}: ${chatMsg.text || '[media]'} -> broadcast a ${clients.size} clientes`);
        
        // Broadcast a todos
        broadcast({ type: 'message', message: chatMsg });
        return;
      }

      // Status (delivered, read)
      if (msg.type === 'status') {
        broadcast({ type: 'status', id: msg.id, status: msg.status, readTime: Date.now() });
        return;
      }

      // Delete
      if (msg.type === 'delete') {
        messageHistory = messageHistory.filter(m => m.id !== msg.id);
        broadcast({ type: 'delete', id: msg.id });
        return;
      }

      // Pin / Unpin
      if (msg.type === 'pin') {
        pinnedMessage = { id: msg.id, text: msg.text, sender: msg.sender };
        broadcast({ type: 'pin', id: msg.id, text: msg.text, sender: msg.sender });
        return;
      }
      if (msg.type === 'unpin') {
        pinnedMessage = null;
        broadcast({ type: 'unpin' });
        return;
      }

      // --- REMOTE AUDIO (consensual) ---
      if (msg.type === 'remote-audio-request') {
        const target = msg.target;
        const targetWs = clients.get(target);
        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
          console.log(`[REMOTE] ${currentUser} -> ${target}: request mic permission`);
          targetWs.send(JSON.stringify({ type: 'remote-audio-request', from: currentUser }));
        } else {
          console.log(`[REMOTE] Target ${target} no conectado`);
        }
        return;
      }

      if (msg.type === 'remote-audio-start') {
        const target = msg.target;
        const targetWs = clients.get(target);
        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
          console.log(`[REMOTE] ${currentUser} -> ${target}: start remote audio`);
          targetWs.send(JSON.stringify({ type: 'remote-audio-start', from: currentUser }));
        }
        return;
      }

      if (msg.type === 'remote-audio-stop') {
        const target = msg.target;
        const targetWs = clients.get(target);
        if (targetWs) {
          targetWs.send(JSON.stringify({ type: 'remote-audio-stop', from: currentUser }));
        }
        // Broadcast stop a todos si target es ALL
        if (target === 'ALL') {
          broadcast({ type: 'remote-audio-stop', from: currentUser });
        }
        return;
      }

      // WebRTC signaling
      if (msg.type === 'remote-audio-offer') {
        const targetWs = clients.get(msg.target);
        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
          targetWs.send(JSON.stringify({ type: 'remote-audio-offer', from: currentUser, offer: msg.offer }));
        }
        return;
      }
      if (msg.type === 'remote-audio-answer') {
        const targetWs = clients.get(msg.target);
        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
          targetWs.send(JSON.stringify({ type: 'remote-audio-answer', from: currentUser, answer: msg.answer }));
        }
        return;
      }
      if (msg.type === 'remote-audio-ice') {
        const targetWs = clients.get(msg.target);
        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
          targetWs.send(JSON.stringify({ type: 'remote-audio-ice', from: currentUser, candidate: msg.candidate }));
        }
        return;
      }

    } catch (e) {
      console.error('Error procesando mensaje:', e);
    }
  });

  ws.on('close', () => {
    if (currentUser) {
      clients.delete(currentUser);
      console.log(`[DISCONNECT] ${currentUser}. Restantes: ${clients.size}`);
      broadcastPresence();
    }
  });
});

function broadcast(data) {
  const str = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(str);
  });
}

function broadcastPresence() {
  const users = Array.from(clients.keys());
  broadcast({ type: 'presence', users });
}

server.listen(PORT, () => {
  console.log(`✅ Chat server corriendo en puerto ${PORT}`);
  console.log(`📁 Sirviendo index.html desde ${__dirname}`);
  console.log(`🔑 Admin KEY: FAITH-ADMIN-2026`);
});
