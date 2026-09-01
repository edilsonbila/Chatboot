const assert = require('assert');
const { responder } = require('./chatbot');

let r = responder({ pergunta: 'Onde tem paracetamol em Nampula?' });
assert.strictEqual(r.farmacias[0].farmacia, 'Farmácia Nampula Central');
assert.strictEqual(r.farmacias[1].farmacia, 'Farmácia Muhala');
assert.ok(r.resposta.includes('MZN'));

r = responder({ pergunta: 'quanto custa coartem perto de mim', lat: -19.84, lng: 34.84 });
assert.strictEqual(r.farmacias[0].farmacia, 'Farmácia Beira Mar');
assert.ok(r.farmacias[0].distancia_km < 1);

r = responder({ pergunta: 'tem brufen?' });
assert.ok(r.farmacias.length === 3 && r.farmacias.every((f) => f.medicamento === 'Ibuprofeno'));
assert.ok(r.farmacias[0].preco <= r.farmacias[1].preco);

r = responder({ pergunta: 'bom dia' });
assert.strictEqual(r.farmacias.length, 0);

r = responder({ pergunta: 'onde tem xpto?' });
assert.ok(r.resposta.includes('Não reconheci o medicamento'));

console.log('Todos os testes passaram.');

r = responder({ pergunta: 'farmácias perto de mim', lat: -25.965, lng: 32.58 });
assert.strictEqual(r.farmacias.length, 5);
assert.ok(r.farmacias.every((f) => f.distancia_km < 3));

r = responder({ pergunta: 'quais farmacias em Chókwè?' });
assert.ok(r.farmacias.length >= 5 && r.farmacias[0].cidade === 'Chókwè');

r = responder({ pergunta: 'paracetamol em maputo' });
assert.ok(r.farmacias.some((f) => f.preco != null) && r.farmacias.some((f) => f.preco == null && f.fonte === 'osm'));

console.log('Testes de farmácias importadas passaram.');

// Pedidos às farmácias próximas
process.env.PEDIDOS_FICHEIRO = require('path').join(require('os').tmpdir(), `pedidos-teste-${Date.now()}.json`);
const pedidos = require('./pedidos');
const { criarMensageiro, normalizarTelefone } = require('./mensageiro');
(async () => {
    const enviadas = [];
    const mensageiro = { nome: 'teste', enviar: async ({ farmacia, texto }) => { enviadas.push({ farmacia, texto }); return { estado: 'enviada' }; } };
    const req = { headers: { host: 'localhost:3000' } };

    const pedido = await pedidos.criarPedido({ pergunta: 'Tem Coartem em Nampula?', lat: NaN, lng: NaN }, mensageiro, req);
    assert.strictEqual(pedido.farmacias.length, 5);
    assert.ok(pedido.farmacias.every((f) => f.distancia_km <= 25 && f.envio.estado === 'enviada'));
    assert.deepStrictEqual(pedido.medicamentos, ['Coartem']);
    assert.ok(enviadas[0].texto.includes('Tem Coartem em Nampula?') && enviadas[0].texto.includes(pedido.id));

    await assert.rejects(pedidos.criarPedido({ pergunta: 'Tem Coartem?' }, mensageiro, req), /Localização/);

    const f = pedido.farmacias[1];
    assert.ok(pedidos.pedidosDaFarmacia(f.id).some((p) => p.id === pedido.id && !p.respondido));
    const resp = pedidos.responderPedido(pedido.id, { farmacia_id: f.id, disponivel: true, preco: '330' });
    assert.strictEqual(resp.preco, 330);
    assert.ok(pedidos.pedidosDaFarmacia(f.id).find((p) => p.id === pedido.id).respondido);
    assert.strictEqual(pedidos.obterPedido(pedido.id).respostas.length, 1);
    assert.throws(() => pedidos.responderPedido(pedido.id, { farmacia_id: 9999, disponivel: true }), /não foi contactada/);

    assert.strictEqual(normalizarTelefone('+258 26 212 333'), '+25826212333');
    assert.strictEqual(normalizarTelefone('84 123 4567'), '+258841234567');
    assert.strictEqual(criarMensageiro().nome, 'console');

    require('fs').unlinkSync(process.env.PEDIDOS_FICHEIRO);
    console.log('Testes de pedidos passaram.');
})().catch((e) => { console.error(e); process.exit(1); });
