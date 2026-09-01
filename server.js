const http = require('http');
const fs = require('fs');
const path = require('path');
const { responder } = require('./chatbot');

const PORT = process.env.PORT || 3000;
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
};

function enviarJson(res, status, corpo) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(corpo));
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/chatbot') {
        const lat = parseFloat(url.searchParams.get('lat'));
        const lng = parseFloat(url.searchParams.get('lng'));
        return enviarJson(res, 200, responder({ pergunta: url.searchParams.get('pergunta') || '', lat, lng }));
    }

    const ficheiro = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const caminho = path.normalize(path.join(__dirname, ficheiro));
    if (!caminho.startsWith(__dirname) || caminho.includes(`${path.sep}data${path.sep}`)) {
        return enviarJson(res, 403, { erro: 'Acesso negado' });
    }
    fs.readFile(caminho, (err, conteudo) => {
        if (err) return enviarJson(res, 404, { erro: 'Não encontrado' });
        res.writeHead(200, { 'Content-Type': MIME[path.extname(caminho)] || 'application/octet-stream' });
        res.end(conteudo);
    });
});

server.listen(PORT, () => console.log(`Servidor a correr em http://localhost:${PORT}`));
