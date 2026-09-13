const http = require('http');
const fs = require('fs');

let messages = [];

if (fs.existsSync('./messages.json')) {
    try {
        messages = JSON.parse(fs.readFileSync('./messages.json', 'utf8'));
    } catch (error) {
        messages = [];
    }
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

    // Obtener mensajes
    if (req.method === 'GET' && req.url === '/messages') {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify(messages));
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
                    time: new Date().toISOString()
                };

                messages.push(message);

                fs.writeFileSync('./messages.json', JSON.stringify(messages, null, 2));
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
