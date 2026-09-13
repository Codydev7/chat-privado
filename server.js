const http = require('http');
const fs = require('fs');

let messages = [];
let clients = [];

if (fs.existsSync('./messages.json')) {
    try {
        messages = JSON.parse(fs.readFileSync('./messages.json', 'utf8'));
    } catch (error) {
        messages = [];
    }
}

function getTime() {
    const now = new Date();

    return now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Santo_Domingo'
    });
}

function sendToClients(message) {
    const data = `data: ${JSON.stringify(message)}\n\n`;

    clients.forEach(client => {
        client.write(data);
    });
}

const server = http.createServer((req, res) => {

    // Página principal
    if (req.method === 'GET' && req.url === '/') {
        fs.readFile('./index.html', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error cargando el chat');
                return;
            }

            res.writeHead(200, {
                'Content-Type': 'text/html; charset=UTF-8'
            });

            res.end(data);
        });

        return;
    }

    // Obtener mensajes anteriores
    if (req.method === 'GET' && req.url === '/messages') {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify(messages));
        return;
    }

    // Conexión en tiempo real
    if (req.method === 'GET' && req.url === '/events') {

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        res.write('\n');

        clients.push(res);

        req.on('close', () => {
            clients = clients.filter(client => client !== res);
        });

        return;
    }

    // Enviar mensaje
    if (req.method === 'POST' && req.url === '/message') {

        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {

            try {
                const data = JSON.parse(body);

                if (!data.text) {
                    res.writeHead(400);
                    res.end(JSON.stringify({
                        error: 'Mensaje vacío'
                    }));
                    return;
                }

                const message = {
                    text: data.text,
                    time: getTime()
                };

                messages.push(message);

                fs.writeFileSync(
                    './messages.json',
                    JSON.stringify(messages, null, 2)
                );

                sendToClients(message);

                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    success: true,
                    message: message
                }));

            } catch (error) {

                res.writeHead(400);
                res.end(JSON.stringify({
                    error: 'JSON inválido'
                }));
            }
        });

        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});

server.listen(process.env.PORT || 8080, '0.0.0.0', () => {
    console.log('Chat privado funcionando en puerto 8080');
});
