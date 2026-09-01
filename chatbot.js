const fs = require('fs');
const path = require('path');

const dados = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'farmacias.json'), 'utf8'));

const SAUDACOES = ['ola', 'olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'eh pa'];
const PALAVRAS_LOCALIZACAO = ['perto', 'proxima', 'proximas', 'proximo', 'proximos', 'onde', 'farmacia', 'farmacias', 'comprar', 'encontrar', 'tem', 'ha', 'preco', 'custa', 'quanto'];

function normalizar(texto) {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function contemTermo(textoNorm, termo) {
    const t = normalizar(termo);
    return new RegExp(`(^|\\s)${t.replace(/[-]/g, '[- ]?')}(\\s|$)`).test(textoNorm);
}

function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const toRad = (g) => (g * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

function encontrarMedicamentos(textoNorm) {
    return dados.medicamentos.filter((m) =>
        [m.nome, ...(m.sinonimos || [])].some((n) => contemTermo(textoNorm, n))
    );
}

function encontrarLocalidade(textoNorm) {
    return dados.localidades.find((l) =>
        [l.nome, ...(l.sinonimos || [])].some((n) => contemTermo(textoNorm, n))
    );
}

function formatarPreco(valor) {
    return `${valor.toFixed(2).replace('.', ',')} MZN`;
}

function formatarDistancia(km) {
    if (km == null) return '';
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function farmaciasComMedicamento(medicamento, origem, limite = 3) {
    const resultados = [];
    for (const f of dados.farmacias) {
        const item = f.estoque.find((e) => e.medicamento_id === medicamento.id && e.quantidade > 0);
        if (!item) continue;
        resultados.push({
            farmacia: f,
            preco: item.preco,
            quantidade: item.quantidade,
            distancia_km: origem ? haversineKm(origem.lat, origem.lng, f.lat, f.lng) : null,
        });
    }
    resultados.sort((a, b) =>
        origem ? a.distancia_km - b.distancia_km : a.preco - b.preco
    );
    return resultados.slice(0, limite);
}

function respostaSaudacao() {
    const opcoes = [
        'Olá! Sou o assistente de farmácias de Moçambique. Diga-me que medicamento procura e onde está (ex.: "Onde tem Paracetamol em Nampula?").',
        'Bom dia! Posso ajudar a encontrar medicamentos nas farmácias mais próximas de si e mostrar os preços. O que procura?',
    ];
    return opcoes[Math.floor(Math.random() * opcoes.length)];
}

function sugestoesPadrao() {
    return ['Onde tem Paracetamol perto de mim?', 'Quanto custa Coartem na Beira?', 'Farmácias com Amoxicilina em Maputo'];
}

function responder({ pergunta = '', lat, lng }) {
    const textoNorm = normalizar(pergunta);
    if (!textoNorm) {
        return { resposta: 'Escreva a sua pergunta, por favor.', sugestoes: sugestoesPadrao(), farmacias: [] };
    }

    const medicamentos = encontrarMedicamentos(textoNorm);
    const localidade = encontrarLocalidade(textoNorm);

    let origem = null;
    let origemDescricao = '';
    if (localidade) {
        origem = { lat: localidade.lat, lng: localidade.lng };
        origemDescricao = `perto de ${localidade.nome}`;
    } else if (Number.isFinite(lat) && Number.isFinite(lng)) {
        origem = { lat, lng };
        origemDescricao = 'perto da sua localização';
    }

    if (medicamentos.length === 0) {
        if (SAUDACOES.some((s) => contemTermo(textoNorm, s)) && textoNorm.split(' ').length <= 4) {
            return { resposta: respostaSaudacao(), sugestoes: sugestoesPadrao(), farmacias: [] };
        }
        const faq = dados.perguntas.find((p) => p.palavras.some((w) => contemTermo(textoNorm, w)));
        if (faq) return { resposta: faq.resposta, sugestoes: sugestoesPadrao(), farmacias: [] };

        if (PALAVRAS_LOCALIZACAO.some((w) => contemTermo(textoNorm, w))) {
            const lista = dados.medicamentos.map((m) => m.nome).join(', ');
            return {
                resposta: `Não reconheci o medicamento. Actualmente tenho informação sobre: ${lista}. Qual deles procura?`,
                sugestoes: dados.medicamentos.slice(0, 4).map((m) => `Onde tem ${m.nome}?`),
                farmacias: [],
            };
        }
        return {
            resposta: 'Não percebi a pergunta. Pode perguntar, por exemplo, "Onde encontro Ibuprofeno em Maputo?" ou "Quanto custa Paracetamol?".',
            sugestoes: sugestoesPadrao(),
            farmacias: [],
        };
    }

    const blocos = [];
    const farmaciasResposta = [];
    for (const med of medicamentos) {
        const encontrados = farmaciasComMedicamento(med, origem);
        if (encontrados.length === 0) {
            blocos.push(`De momento nenhuma farmácia registada tem <strong>${med.nome}</strong> em stock.`);
            continue;
        }
        const cabecalho = origem
            ? `Farmácias ${origemDescricao} com <strong>${med.nome}</strong>:`
            : `Farmácias com <strong>${med.nome}</strong> (ordenadas por preço; diga a sua cidade ou active a localização para ver as mais próximas):`;
        const linhas = encontrados.map((r, i) => {
            const dist = r.distancia_km != null ? ` — ${formatarDistancia(r.distancia_km)}` : '';
            return `${i + 1}. <strong>${r.farmacia.nome}</strong> (${r.farmacia.cidade})${dist}<br>` +
                `&nbsp;&nbsp;Preço: <strong>${formatarPreco(r.preco)}</strong> · ${r.farmacia.endereco} · ${r.farmacia.horario} · ${r.farmacia.telefone}`;
        });
        blocos.push(`${cabecalho}<br>${linhas.join('<br>')}`);
        encontrados.forEach((r) =>
            farmaciasResposta.push({
                medicamento: med.nome,
                farmacia: r.farmacia.nome,
                cidade: r.farmacia.cidade,
                endereco: r.farmacia.endereco,
                telefone: r.farmacia.telefone,
                horario: r.farmacia.horario,
                preco: r.preco,
                distancia_km: r.distancia_km == null ? null : Number(r.distancia_km.toFixed(2)),
                lat: r.farmacia.lat,
                lng: r.farmacia.lng,
            })
        );
    }

    const sugestoes = [];
    if (!origem) sugestoes.push(`${medicamentos[0].nome} em Maputo`, `${medicamentos[0].nome} na Beira`);
    const outro = dados.medicamentos.find((m) => !medicamentos.includes(m));
    if (outro) sugestoes.push(`Onde tem ${outro.nome}${localidade ? ' em ' + localidade.nome : ''}?`);
    sugestoes.push('Precisa de receita?');

    return { resposta: blocos.join('<br><br>'), sugestoes, farmacias: farmaciasResposta };
}

module.exports = { responder, normalizar, haversineKm };
