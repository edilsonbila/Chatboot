const select = document.getElementById('farmacia-select');
const lista = document.getElementById('pedidos');
const params = new URLSearchParams(location.search);
const pedidoDestacado = params.get('pedido');

function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function farmaciaActual() {
    return Number(select.value);
}

function guardarEscolha() {
    localStorage.setItem('farmacia_id', select.value);
    carregarPedidos();
}

async function carregarFarmacias() {
    const farmacias = await fetch('/farmacias').then((r) => r.json());
    select.innerHTML = farmacias
        .map((f) => `<option value="${f.id}">${escapeHtml(f.nome)} — ${escapeHtml(f.cidade)}</option>`)
        .join('');
    let escolhida = localStorage.getItem('farmacia_id');
    if (pedidoDestacado && !escolhida) {
        const pedido = await fetch(`/pedidos/${pedidoDestacado}`).then((r) => (r.ok ? r.json() : null));
        if (pedido && pedido.farmacias.length) escolhida = pedido.farmacias[0].id;
    }
    if (escolhida) select.value = escolhida;
    select.onchange = guardarEscolha;
    carregarPedidos();
}

function formularioResposta(p) {
    return `
        <form class="resposta-form" data-pedido="${p.id}">
            <label><input type="radio" name="disponivel" value="true" checked> Tenho disponível</label>
            <label><input type="radio" name="disponivel" value="false"> Não tenho</label>
            <input type="number" name="preco" class="chat-input" min="0" step="0.5" placeholder="Preço (MZN)">
            <input type="text" name="mensagem" class="chat-input" maxlength="500" placeholder="Mensagem para o cliente (opcional)">
            <button type="submit" class="chat-button">Responder ao cliente</button>
        </form>`;
}

async function carregarPedidos() {
    const id = farmaciaActual();
    if (!id) return;
    const pedidos = await fetch(`/farmacias/${id}/pedidos`).then((r) => r.json());
    if (!pedidos.length) {
        lista.innerHTML = '<div class="chat-response">Ainda não há pedidos de clientes para esta farmácia.</div>';
        return;
    }
    lista.innerHTML = pedidos
        .map(
            (p) => `
            <div class="chat-response pedido ${p.id === pedidoDestacado ? 'destacado' : ''}">
                <strong>Cliente a ${p.distancia_km} km pergunta:</strong>
                <div class="pergunta">"${escapeHtml(p.pergunta)}"</div>
                <small>${new Date(p.criado_em).toLocaleString('pt-PT')}${p.medicamentos.length ? ' · ' + escapeHtml(p.medicamentos.join(', ')) : ''}</small>
                ${p.respondido ? '<div class="respondido">Já respondeu a este pedido.</div>' : formularioResposta(p)}
            </div>`
        )
        .join('');

    lista.querySelectorAll('.resposta-form').forEach((form) => {
        form.onsubmit = async (ev) => {
            ev.preventDefault();
            const fd = new FormData(form);
            const corpo = {
                farmacia_id: farmaciaActual(),
                disponivel: fd.get('disponivel') === 'true',
                preco: fd.get('preco') || null,
                mensagem: fd.get('mensagem') || null,
            };
            const r = await fetch(`/pedidos/${form.dataset.pedido}/respostas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(corpo),
            });
            if (!r.ok) {
                const erro = await r.json();
                alert(erro.erro || 'Erro ao responder');
                return;
            }
            carregarPedidos();
        };
    });
}

carregarFarmacias();
setInterval(carregarPedidos, 10000);
