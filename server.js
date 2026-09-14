const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/healthz', (req, res) => res.status(200).send('OK'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'), err => {
    if(err) res.status(200).send('Server running - add index.html');
  });
});

app.use(express.static(__dirname));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();
let messageHistory = [];

wss.on('connection', ws => {
  let currentUser = null;
  ws.on('message', data => {
    try{
      var msg = JSON.parse(data.toString());
      if(msg.type==='presence'){
        currentUser = msg.sender;
        clients.set(currentUser, ws);
        console.log('[JOIN] '+currentUser+' total '+clients.size);
        ws.send(JSON.stringify({type:'history', messages:messageHistory}));
        var users = Array.from(clients.keys());
        var payload = JSON.stringify({type:'presence', users:users});
        wss.clients.forEach(function(c){ if(c.readyState===1) c.send(payload); });
      } else if(msg.type==='message'){
        var chatMsg = msg.message;
        chatMsg.id = chatMsg.id || Date.now().toString();
        chatMsg.timestamp = Date.now();
        messageHistory.push(chatMsg);
        if(messageHistory.length>500) messageHistory.shift();
        var payload = JSON.stringify({type:'message', message:chatMsg});
        wss.clients.forEach(function(c){ if(c.readyState===1) c.send(payload); });
      } else {
        var target = msg.target;
        if(target && msg.type && msg.type.indexOf('remote-audio')!==-1){
          var tWs = clients.get(target);
          if(tWs && tWs.readyState===1) tWs.send(JSON.stringify(Object.assign({}, msg, {from:currentUser})));
          if(target==='ALL'){
            wss.clients.forEach(function(c){ if(c.readyState===1) c.send(JSON.stringify(Object.assign({}, msg, {from:currentUser}))); });
          }
        } else {
          var payload = JSON.stringify(msg);
          wss.clients.forEach(function(c){ if(c.readyState===1) c.send(payload); });
        }
      }
    }catch(e){ console.error(e); }
  });
  ws.on('close', function(){
    if(currentUser){
      clients.delete(currentUser);
      var users = Array.from(clients.keys());
      var payload = JSON.stringify({type:'presence', users:users});
      wss.clients.forEach(function(c){ if(c.readyState===1) c.send(payload); });
    }
  });
});

server.listen(PORT, '0.0.0.0', function(){
  console.log('LIVE on 0.0.0.0:'+PORT);
  console.log('Health: /health');
  console.log('Admin: FAITH-ADMIN-2026');
});
