const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Busboy = require('busboy');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const DATA_FILE = './messages.json';
const UPLOAD_DIR = './uploads';

let messages = [];

if (fs.existsSync(DATA_FILE)) {
    try {
        messages = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        if (!Array.isArray(messages)) messages = [];
    } catch {
        messages = [];
    }
}

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function saveMessages() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2));
}

function getTime() {
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/Santo_Domingo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(new Date());
}

function broadcast(data) {
    const text = JSON.stringify(data);

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(text);
        }
    });
}

function deleteFile(file) {
    if (!file) return;

    const filename = path.basename(file);
    const filePath = path.join(UPLOAD_DIR, filename);

    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch {}
    }
}

function cleanOldPhotos() {
    const now = Date.now();
    const twelveHours = 12 * 60 * 60 * 1000;

    let changed = false;

    messages = messages.filter(message => {
        if (
            message.type === 'photo' &&
            message.timestamp &&
            now - message.timestamp >= twelveHours
        ) {
            deleteFile(message.file);
            changed = true;
            return false;
        }

        return true;
    });

    if (changed) {
        saveMessages();
    }
}

setInterval(cleanOldPhotos, 10 * 60 * 1000);
cleanOldPhotos();

const server = http.createServer((req, res) => {

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

    if (req.method === 'GET' && req.url === '/messages') {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify(messages));
        return;
    }

    if (req.method === 'GET' && req.url.startsWith('/uploads/')) {
        const filename = path.basename(req.url.split('?')[0]);
        const filePath = path.join(UPLOAD_DIR, filename);

        if (!fs.existsSync(filePath)) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }

        const ext = path.extname(filename).toLowerCase();

        const types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif',
            '.webm': 'audio/webm',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.m4a': 'audio/mp4'
        };

        res.writeHead(200, {
            'Content-Type': types[ext] || 'application/octet-stream',
            'Cache-Control': 'public, max-age=3600'
        });

        fs.createReadStream(filePath).pipe(res);
        return;
    }

    if (req.method === 'POST' && req.url === '/upload') {
        const busboy = Busboy({
            headers: req.headers
        });

        let savedFile = null;

        busboy.on('file', (fieldname, file, info) => {
            const originalName = info.filename || 'file';
            const ext = path.extname(originalName).toLowerCase();

            const safeExt = ext && ext.length <= 10 ? ext : '';

            const filename =
                crypto.randomUUID() + safeExt;

            const filePath =
                path.join(UPLOAD_DIR, filename);

            savedFile = '/uploads/' + filename;

            const writeStream =
                fs.createWriteStream(filePath);

            file.pipe(writeStream);
        });

        busboy.on('finish', () => {
            if (!savedFile) {
                res.writeHead(400, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    success: false,
                    error: 'No file received'
                }));

                return;
            }

            res.writeHead(200, {
                'Content-Type': 'application/json'
            });

            res.end(JSON.stringify({
                success: true,
                file: savedFile
            }));
        });

        busboy.on('error', error => {
            console.error('Upload error:', error.message);

            res.writeHead(500, {
                'Content-Type': 'application/json'
            });

            res.end(JSON.stringify({
                success: false
            }));
        });

        req.pipe(busboy);
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});

const wss = new WebSocket.Server({
    server
});

wss.on('connection', ws => {

    ws.send(JSON.stringify({
        type: 'history',
        messages
    }));

    ws.on('message', raw => {
        try {
            const data = JSON.parse(raw.toString());

            if (data.type === 'message') {
                const message = {
                    id: crypto.randomUUID(),
                    type: 'text',
                    text: String(data.text || '').trim(),
                    sender: String(data.sender || 'Usuario'),
                    time: getTime(),
                    timestamp: Date.now(),
                    status: 'sent'
                };

                if (!message.text) return;

                messages.push(message);
                saveMessages();

                broadcast({
                    type: 'message',
                    message
                });

                return;
            }

            if (data.type === 'media') {
                if (
                    data.mediaType !== 'photo' &&
                    data.mediaType !== 'audio'
                ) {
                    return;
                }

                if (!data.file) return;

                const message = {
                    id: crypto.randomUUID(),
                    type: data.mediaType,
                    file: String(data.file),
                    sender: String(data.sender || 'Usuario'),
                    time: getTime(),
                    timestamp: Date.now(),
                    status: 'sent'
                };

                messages.push(message);
                saveMessages();

                broadcast({
                    type: 'message',
                    message
                });

                return;
            }

            if (data.type === 'status') {
                const message =
                    messages.find(m => m.id === data.id);

                if (!message) return;

                if (
                    data.status === 'delivered' ||
                    data.status === 'read'
                ) {
                    message.status = data.status;

                    if (data.status === 'read') {
                        message.readTime = getTime();
                    }

                    saveMessages();

                    broadcast({
                        type: 'status',
                        id: message.id,
                        status: message.status,
                        readTime: message.readTime || null
                    });
                }

                return;
            }

            if (data.type === 'delete') {
                const index =
                    messages.findIndex(m => m.id === data.id);

                if (index === -1) return;

                const message = messages[index];

                if (message.file) {
                    deleteFile(message.file);
                }

                messages.splice(index, 1);
                saveMessages();

                broadcast({
                    type: 'delete',
                    id: data.id
                });

                return;
            }

        } catch (error) {
            console.error('WebSocket error:', error.message);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(
        `Chat privado funcionando en puerto ${PORT}`
    );
});
                    
