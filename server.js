const http = require('http');
const WebSocket = require('ws');

console.log('WS PRUEBA');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('WS TEST OK');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    console.log('WEBSOCKET CONECTADO');

    ws.send('Hola desde WebSocket');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`PUERTO ABIERTO: ${PORT}`);
});
