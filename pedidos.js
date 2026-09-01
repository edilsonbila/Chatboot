// Pedidos: a pergunta do utilizador é enviada às farmácias mais próximas, que respondem
// (disponibilidade e preço). As respostas ficam associadas ao pedido para o utilizador as ver no chat.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { analisarPergunta, farmaciasProximas, dados } = require('./chatbot');

const FICHEIRO = process.env.PEDIDOS_FICHEIRO || path.join(__dirname, 'data', 'pedidos.json');
const MAX_FARMACIAS = 5;
const RAIO_KM = 25;

function carregar() {
    try {
        return JSON.parse(fs.readFileSync(FICHEIRO, 'utf8'));
    } catch {
        return [];
    }
}

function guardar(pedidos) {
    fs.mkdirSync(path.dirname(FICHEIRO), { recursive: true });
    fs.writeFileSync(FICHEIRO, JSON.stringify(pedidos, null, 2));
}

function textoMensagem(pedido, farmacia) {
    const med = pedido.medicamentos.length ? pedido.medicamentos.join(', ') : 'um medicamento';
    return (
        `Olá ${farmacia.nome}! Um cliente a ${farmacia.distancia_km.toFixed(1)} km de si pergunta: "${pedido.pergunta}". ` +
        `Tem ${med} disponível e a que preço? Responda em ${pedido.url_resposta}`
    );
}

function baseUrl(req) {
    return process.env.BASE_URL || `http://${req.headers.host}`;
}

async function criarPedido({ pergunta, lat, lng, contacto }, mensageiro, req) {
    if (!pergunta || !pergunta.trim()) throw Object.assign(new Error('Pergunta em falta'), { status: 400 });

    const { medicamentos, localidade, origem } = analisarPergunta(pergunta, lat, lng);
    if (!origem) {
        throw Object.assign(new Error('Localização em falta: active o GPS ou indique a cidade na pergunta'), { status: 400 });
    }

    const proximas = farmaciasProximas(origem, MAX_FARMACIAS, new Set(), RAIO_KM);
    if (!proximas.length) throw Object.assign(new Error('Não há farmácias registadas num raio de 25 km'), { status: 404 });

    const id = crypto.randomBytes(6).toString('hex');
    const pedido = {
        id,
        criado_em: new Date().toISOString(),
        pergunta: pergunta.trim(),
        medicamentos: medicamentos.map((m) => m.nome),
        origem: { ...origem, descricao: localidade ? localidade.nome : 'localização GPS' },
        contacto: contacto || null,
        url_resposta: `${baseUrl(req)}/farmacia.html?pedido=${id}`,
        farmacias: proximas.map((r) => ({
            id: r.farmacia.id,
            nome: r.farmacia.nome,
            cidade: r.farmacia.cidade,
            telefone: r.farmacia.telefone || null,
            distancia_km: Number(r.distancia_km.toFixed(2)),
            envio: null,
        })),
        respostas: [],
    };

    for (const f of pedido.farmacias) {
        try {
            f.envio = await mensageiro.enviar({ farmacia: f, texto: textoMensagem(pedido, f) });
        } catch (err) {
            f.envio = { estado: 'falhou', detalhe: err.message };
        }
        f.envio.em = new Date().toISOString();
    }

    const pedidos = carregar();
    pedidos.push(pedido);
    guardar(pedidos);
    return pedido;
}

function obterPedido(id) {
    return carregar().find((p) => p.id === id) || null;
}

function pedidosDaFarmacia(farmaciaId) {
    return carregar()
        .filter((p) => p.farmacias.some((f) => f.id === farmaciaId))
        .sort((a, b) => b.criado_em.localeCompare(a.criado_em))
        .map((p) => ({
            id: p.id,
            criado_em: p.criado_em,
            pergunta: p.pergunta,
            medicamentos: p.medicamentos,
            distancia_km: p.farmacias.find((f) => f.id === farmaciaId).distancia_km,
            respondido: p.respostas.some((r) => r.farmacia_id === farmaciaId),
        }));
}

function responderPedido(id, { farmacia_id, disponivel, preco, mensagem }) {
    const pedidos = carregar();
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) throw Object.assign(new Error('Pedido não encontrado'), { status: 404 });

    const farmaciaId = Number(farmacia_id);
    const destinatario = pedido.farmacias.find((f) => f.id === farmaciaId);
    if (!destinatario) throw Object.assign(new Error('Esta farmácia não foi contactada para este pedido'), { status: 403 });
    if (typeof disponivel !== 'boolean') throw Object.assign(new Error('Campo "disponivel" (true/false) em falta'), { status: 400 });

    const precoNum = preco === undefined || preco === null || preco === '' ? null : Number(preco);
    if (precoNum !== null && !(precoNum >= 0)) throw Object.assign(new Error('Preço inválido'), { status: 400 });

    const farmacia = dados.farmacias.find((f) => f.id === farmaciaId);
    const resposta = {
        farmacia_id: farmaciaId,
        farmacia: destinatario.nome,
        cidade: destinatario.cidade,
        endereco: farmacia ? farmacia.endereco : null,
        telefone: destinatario.telefone,
        distancia_km: destinatario.distancia_km,
        disponivel,
        preco: precoNum,
        mensagem: mensagem ? String(mensagem).slice(0, 500) : null,
        em: new Date().toISOString(),
    };
    pedido.respostas = pedido.respostas.filter((r) => r.farmacia_id !== farmaciaId);
    pedido.respostas.push(resposta);
    pedido.respostas.sort((a, b) => Number(b.disponivel) - Number(a.disponivel) || (a.preco ?? Infinity) - (b.preco ?? Infinity));
    guardar(pedidos);
    return resposta;
}

function listarFarmacias() {
    return dados.farmacias
        .map((f) => ({ id: f.id, nome: f.nome, cidade: f.cidade }))
        .sort((a, b) => a.cidade.localeCompare(b.cidade, 'pt') || a.nome.localeCompare(b.nome, 'pt'));
}

module.exports = { criarPedido, obterPedido, pedidosDaFarmacia, responderPedido, listarFarmacias, textoMensagem };
