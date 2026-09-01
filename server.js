const http = require('http');
const fs = require('fs');
const path = require('path');
const { responder } = require('./chatbot');
const { criarMensageiro } = require('./mensageiro');
const pedidos = require('./pedidos');

const PORT = process.env.PORT || 3000;
const mensageiro = criarMensageiro();
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

function lerJson(req) {
    return new Promise((resolve, reject) => {
        let corpo = '';
        req.on('data', (c) => {
            corpo += c;
            if (corpo.length > 1e5) reject(Object.assign(new Error('Pedido demasiado grande'), { status: 413 }));
        });
        req.on('end', () => {
            try {
                resolve(corpo ? JSON.parse(corpo) : {});
            } catch {
                reject(Object.assign(new Error('JSON inválido'), { status: 400 }));
            }
        });
    });
}

async function tratarApi(req, res, url) {
    const partes = url.pathname.split('/').filter(Boolean);

    if (url.pathname === '/chatbot' && req.method === 'GET') {
        const lat = parseFloat(url.searchParams.get('lat'));
        const lng = parseFloat(url.searchParams.get('lng'));
        return enviarJson(res, 200, responder({ pergunta: url.searchParams.get('pergunta') || '', lat, lng }));
    }

    if (url.pathname === '/pedidos' && req.method === 'POST') {
        const corpo = await lerJson(req);
        const pedido = await pedidos.criarPedido(
            { pergunta: corpo.pergunta, lat: Number(corpo.lat), lng: Number(corpo.lng), contacto: corpo.contacto },
            mensageiro,
            req
        );
        return enviarJson(res, 201, pedido);
    }

    if (partes[0] === 'pedidos' && partes.length === 2 && req.method === 'GET') {
        const pedido = pedidos.obterPedido(partes[1]);
        return pedido ? enviarJson(res, 200, pedido) : enviarJson(res, 404, { erro: 'Pedido não encontrado' });
    }

    if (partes[0] === 'pedidos' && partes[2] === 'respostas' && req.method === 'POST') {
        const corpo = await lerJson(req);
        return enviarJson(res, 201, pedidos.responderPedido(partes[1], corpo));
    }

    if (url.pathname === '/farmacias' && req.method === 'GET') {
        return enviarJson(res, 200, pedidos.listarFarmacias());
    }

    if (partes[0] === 'farmacias' && partes[2] === 'pedidos' && req.method === 'GET') {
        return enviarJson(res, 200, pedidos.pedidosDaFarmacia(Number(partes[1])));
    }

    return false;
}

function servirEstatico(res, pathname) {
    const ficheiro = pathname === '/' ? 'index.html' : pathname.slice(1);
    const caminho = path.normalize(path.join(__dirname, ficheiro));
    if (!caminho.startsWith(__dirname) || caminho.includes(`${path.sep}data${path.sep}`)) {
        return enviarJson(res, 403, { erro: 'Acesso negado' });
    }
    fs.readFile(caminho, (err, conteudo) => {
        if (err) return enviarJson(res, 404, { erro: 'Não encontrado' });
        res.writeHead(200, { 'Content-Type': MIME[path.extname(caminho)] || 'application/octet-stream' });
        res.end(conteudo);
    });
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    try {
        const tratado = await tratarApi(req, res, url);
        if (tratado === false) servirEstatico(res, url.pathname);
    } catch (err) {
        enviarJson(res, err.status || 500, { erro: err.message });
    }
});

server.listen(PORT, () => console.log(`Servidor a correr em http://localhost:${PORT} (mensageiro: ${mensageiro.nome})`));
