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
