let userLocation = null;

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
