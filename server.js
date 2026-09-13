const http = require('http');
const WebSocket = require('ws');

console.log('INICIO WS');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    res.end('TEST');
});

const wss = new WebSocket.WebSocketServer({
    port: 0
});

wss.on('connection', ws => {
    console.log('CLIENTE WS CONECTADO');

    ws.send('Hola');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('PUERTO HTTP ABIERTO:', PORT);
});

console.log('WS CREADO');
