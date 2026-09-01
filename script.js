let userLocation = null;
const pedidosActivos = {};

function setLocationStatus(text) {
    document.getElementById('location-status').textContent = text;
}

function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function displayMessage(sender, html) {
    const chatLog = document.getElementById('chat-log');
    const el = document.createElement('div');
    el.className = 'chat-response';
    el.innerHTML = `<strong>${sender}:</strong> ${html}`;
    chatLog.appendChild(el);
    chatLog.scrollTop = chatLog.scrollHeight;
    return el;
}

function formatarPreco(v) {
    return `${Number(v).toFixed(2).replace('.', ',')} MZN`;
}

function mostrarBotaoPedido(pergunta) {
    const el = displayMessage(
        'Assistente',
        'Quer que eu envie esta pergunta às farmácias mais próximas de si para confirmarem disponibilidade e preço? '
    );
    const btn = document.createElement('button');
    btn.className = 'chat-button chat-button-inline';
    btn.textContent = 'Perguntar às farmácias próximas';
    btn.onclick = () => {
        btn.disabled = true;
        criarPedido(pergunta);
    };
    el.appendChild(btn);
}

function criarPedido(pergunta) {
    const corpo = { pergunta };
    if (userLocation) {
        corpo.lat = userLocation.lat;
        corpo.lng = userLocation.lng;
    }
    fetch('/pedidos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
        .then(async (r) => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.erro || 'Erro ao criar pedido');
            return data;
        })
        .then((pedido) => {
            const lista = pedido.farmacias
                .map((f) => `• ${escapeHtml(f.nome)} (${escapeHtml(f.cidade)}, ${f.distancia_km} km)`)
                .join('<br>');
            const el = displayMessage(
                'Assistente',
                `Enviei a sua pergunta a ${pedido.farmacias.length} farmácias perto de ${escapeHtml(pedido.origem.descricao)}:<br>${lista}<br>` +
                    `<em>Pedido nº ${pedido.id}. Vou avisar aqui assim que responderem.</em>`
            );
            const estado = document.createElement('div');
            estado.className = 'pedido-respostas';
            el.appendChild(estado);
            pedidosActivos[pedido.id] = { vistas: new Set(), estado };
            acompanharPedido(pedido.id);
        })
        .catch((err) => displayMessage('Assistente', escapeHtml(err.message)));
}

function acompanharPedido(id) {
    const ctx = pedidosActivos[id];
    if (!ctx) return;
    fetch(`/pedidos/${id}`)
        .then((r) => r.json())
        .then((pedido) => {
            pedido.respostas.forEach((resp) => {
                if (ctx.vistas.has(resp.farmacia_id)) return;
                ctx.vistas.add(resp.farmacia_id);
                const texto = resp.disponivel
                    ? `<strong>${escapeHtml(resp.farmacia)}</strong> (${resp.distancia_km} km) respondeu: <strong>tem disponível</strong>` +
                      (resp.preco != null ? ` por <strong>${formatarPreco(resp.preco)}</strong>` : '')
                    : `<strong>${escapeHtml(resp.farmacia)}</strong> (${resp.distancia_km} km) respondeu: <strong>não tem</strong> de momento`;
                const extra = [resp.mensagem && escapeHtml(resp.mensagem), resp.endereco && escapeHtml(resp.endereco), resp.telefone && escapeHtml(resp.telefone)]
                    .filter(Boolean)
                    .join(' · ');
                displayMessage('Farmácia', `${texto}.${extra ? `<br>${extra}` : ''}`);
            });
            ctx.estado.textContent = `${pedido.respostas.length} de ${pedido.farmacias.length} farmácias responderam.`;
            if (pedido.respostas.length < pedido.farmacias.length) setTimeout(() => acompanharPedido(id), 5000);
            else delete pedidosActivos[id];
        })
        .catch(() => setTimeout(() => acompanharPedido(id), 10000));
}

function renderSuggestions(sugestoes) {
    const container = document.getElementById('chat-suggestions');
    const list = document.getElementById('suggestions-list');
    list.innerHTML = '';
    sugestoes.forEach((s) => {
        const li = document.createElement('li');
        li.textContent = s;
        li.onclick = () => selectSuggestion(s);
        list.appendChild(li);
    });
    container.style.display = sugestoes.length ? 'block' : 'none';
}

function sendMessage() {
    const input = document.getElementById('user-input');
    const pergunta = input.value.trim();
    if (!pergunta) return;

    displayMessage('Você', escapeHtml(pergunta));
    input.value = '';

    const params = new URLSearchParams({ pergunta });
    if (userLocation) {
        params.set('lat', userLocation.lat);
        params.set('lng', userLocation.lng);
    }

    fetch(`/chatbot?${params.toString()}`)
        .then((r) => r.json())
        .then((data) => {
            displayMessage('Assistente', data.resposta);
            renderSuggestions(data.sugestoes || []);
            if ((data.farmacias || []).some((f) => f.medicamento)) mostrarBotaoPedido(pergunta);
        })
        .catch(() => displayMessage('Assistente', 'Ocorreu um erro ao contactar o servidor. Tente novamente.'));
}

function handleEnter(event) {
    if (event.key === 'Enter') sendMessage();
}

function selectSuggestion(sugestao) {
    document.getElementById('user-input').value = sugestao;
    sendMessage();
}

function requestLocation() {
    if (!navigator.geolocation) {
        setLocationStatus('Localização indisponível — indique a sua cidade na pergunta.');
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setLocationStatus('Localização activa — a mostrar farmácias perto de si.');
        },
        () => setLocationStatus('Sem acesso à localização — indique a sua cidade na pergunta (ex.: "em Nampula").'),
        { timeout: 8000 }
    );
}

window.addEventListener('DOMContentLoaded', () => {
    requestLocation();
    displayMessage(
        'Assistente',
        'Olá! Sou o assistente de farmácias de Moçambique. Pergunte-me onde encontrar um medicamento e eu mostro as farmácias mais próximas e os preços.'
    );
    renderSuggestions(['Onde tem Paracetamol perto de mim?', 'Quanto custa Coartem na Beira?', 'Farmácias com Amoxicilina em Maputo']);
});
