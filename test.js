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
