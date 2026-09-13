const http = require('http');
const WebSocket = require('ws');

console.log('INICIO');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });

    res.end('CHAT SERVER TEST OK');
});

const wss = new WebSocket.WebSocketServer({
    server: server
});

wss.on('connection', ws => {
    console.log('WEBSOCKET CONECTADO');

    ws.send('Hola desde el servidor');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`PUERTO ABIERTO: ${PORT}`);
});
