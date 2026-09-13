const http = require('http');

console.log('INICIO');

try {
    const WebSocket = require('ws');
    console.log('WS INSTALADO');
} catch (error) {
    console.error('ERROR CARGANDO WS');
    console.error(error);
}

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    res.end('TEST');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('PUERTO ABIERTO:', PORT);
});
