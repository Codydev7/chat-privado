const http = require('http');

console.log('PRUEBA SERVER.JS');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });

    res.end('SERVIDOR DE PRUEBA FUNCIONANDO');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`PUERTO ABIERTO: ${PORT}`);
});
