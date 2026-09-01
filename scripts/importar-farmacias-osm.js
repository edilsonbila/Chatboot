// Importa todas as farmácias de Moçambique do OpenStreetMap (Overpass API)
// e junta-as às farmácias já registadas em data/farmacias.json.
//
// Uso: node scripts/importar-farmacias-osm.js [--offline]
//   --offline  usa data/osm-farmacias.json (última resposta guardada) em vez de chamar a API

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const FICHEIRO_DADOS = path.join(RAIZ, 'data', 'farmacias.json');
const FICHEIRO_CACHE = path.join(RAIZ, 'data', 'osm-farmacias.json');
const FICHEIRO_SQL = path.join(RAIZ, 'DataBase', 'farmacias_osm.sql');

const QUERY = `[out:json][timeout:120];
area["ISO3166-1"="MZ"]->.mz;
(
  nwr["amenity"="pharmacy"](area.mz);
  nwr["healthcare"="pharmacy"](area.mz);
  nwr["shop"="chemist"](area.mz);
);
out center tags;`;

function normalizar(texto) {
    return String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const toRad = (g) => (g * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

async function obterOsm(offline) {
    if (!offline) {
        try {
            const res = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'chatbot-farmacia-mocambique/1.0 (importador de farmacias)',
                    Accept: 'application/json',
                },
                body: 'data=' + encodeURIComponent(QUERY),
            });
            if (!res.ok) throw new Error(`Overpass respondeu ${res.status}`);
            const json = await res.json();
            fs.writeFileSync(FICHEIRO_CACHE, JSON.stringify(json));
            console.log(`Overpass: ${json.elements.length} elementos (guardado em data/osm-farmacias.json)`);
            return json;
        } catch (err) {
            console.warn(`Falha ao contactar Overpass (${err.message}); a usar cache local.`);
        }
    }
    return JSON.parse(fs.readFileSync(FICHEIRO_CACHE, 'utf8'));
}

function localidadeMaisProxima(localidades, lat, lng) {
    let melhor = null;
    for (const l of localidades) {
        const d = haversineKm(lat, lng, l.lat, l.lng);
        if (!melhor || d < melhor.d) melhor = { l, d };
    }
    return melhor;
}

function limparNome(nome) {
    return String(nome || '').replace(/\s+/g, ' ').trim();
}

function paraFarmacia(el, localidades) {
    const t = el.tags || {};
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) return null;

    const prox = localidadeMaisProxima(localidades, lat, lng);
    const cidade = prox && prox.d <= 25
        ? prox.l.nome
        : limparNome(t['addr:city'] || t['addr:place'] || t['addr:village'] || t['addr:district']) || (prox ? prox.l.nome : 'Moçambique');
    const provincia = limparNome(t['addr:province']) || (prox ? prox.l.provincia : '');

    let nome = limparNome(t['name:pt'] || t.name);
    if (!nome || /^farm[aá]cia$/i.test(nome)) nome = `Farmácia (${cidade})`;

    const endereco = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(', ')
        || limparNome(t['addr:place'] || t['addr:village'] || t['addr:district'])
        || cidade;

    return {
        nome,
        cidade,
        provincia,
        endereco,
        telefone: limparNome(t.phone || t.mobile || t['contact:phone']) || null,
        horario: limparNome(t.opening_hours) || null,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        fonte: 'osm',
        osm_id: `${el.type}/${el.id}`,
        estoque: [],
    };
}

function sql(valor) {
    if (valor == null) return 'NULL';
    return `'${String(valor).replace(/'/g, "''")}'`;
}

async function main() {
    const offline = process.argv.includes('--offline');
    const dados = JSON.parse(fs.readFileSync(FICHEIRO_DADOS, 'utf8'));
    const osm = await obterOsm(offline);

    const manuais = dados.farmacias.filter((f) => f.fonte !== 'osm');
    const importadas = [];
    const vistos = new Set();

    for (const el of osm.elements) {
        const f = paraFarmacia(el, dados.localidades);
        if (!f) continue;
        const duplicada = [...manuais, ...importadas].some(
            (g) => haversineKm(f.lat, f.lng, g.lat, g.lng) < 0.15 && normalizar(g.nome) === normalizar(f.nome)
        );
        if (duplicada || vistos.has(f.osm_id)) continue;
        vistos.add(f.osm_id);
        importadas.push(f);
    }

    importadas.sort((a, b) => a.cidade.localeCompare(b.cidade, 'pt') || a.nome.localeCompare(b.nome, 'pt'));
    let proximoId = manuais.reduce((m, f) => Math.max(m, f.id), 0) + 1;
    importadas.forEach((f) => (f.id = proximoId++));

    dados.farmacias = [...manuais, ...importadas];
    dados.actualizado_em = new Date().toISOString();
    fs.writeFileSync(FICHEIRO_DADOS, JSON.stringify(dados, null, 2) + '\n');

    const linhas = importadas.map(
        (f) => `(${f.id}, ${sql(f.nome)}, ${sql(f.cidade)}, ${sql(f.provincia)}, ${sql(f.endereco)}, ${sql(f.telefone)}, ${sql(f.horario)}, ${f.lat}, ${f.lng}, 'osm', ${sql(f.osm_id)})`
    );
    fs.writeFileSync(
        FICHEIRO_SQL,
        `-- Farmácias de Moçambique importadas do OpenStreetMap (${dados.actualizado_em})\n` +
            '-- Gerado por scripts/importar-farmacias-osm.js. Executar depois de farmacia_chatbot.sql.\n\n' +
            'ALTER TABLE `farmacias`\n  ADD COLUMN IF NOT EXISTS `fonte` varchar(20) NOT NULL DEFAULT \'manual\',\n  ADD COLUMN IF NOT EXISTS `osm_id` varchar(40) DEFAULT NULL;\n\n' +
            'INSERT INTO `farmacias` (`id`,`nome`,`cidade`,`provincia`,`endereco`,`telefone`,`horario`,`latitude`,`longitude`,`fonte`,`osm_id`) VALUES\n' +
            linhas.join(',\n') +
            ';\n'
    );

    const porCidade = {};
    importadas.forEach((f) => (porCidade[f.cidade] = (porCidade[f.cidade] || 0) + 1));
    console.log(`Importadas ${importadas.length} farmácias do OSM (+ ${manuais.length} registadas manualmente).`);
    console.log(porCidade);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
