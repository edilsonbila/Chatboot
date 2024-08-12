document.getElementById('send-button').addEventListener('click', sendMessage);

function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (userInput.trim() === '') return;

    displayMessage('Você', userInput);

    // Enviar pergunta para o backend e obter resposta
    fetch(`/chatbot?pergunta=${encodeURIComponent(userInput)}`)
        .then(response => response.json())
        .then(data => {
            displayMessage('Chatbot', data.resposta);
        });

    document.getElementById('user-input').value = '';
}

function displayMessage(sender, message) {
    const chatLog = document.getElementById('chat-log');
    const messageElement = document.createElement('div');
    messageElement.textContent = `${sender}: ${message}`;
    chatLog.appendChild(messageElement);
    chatLog.scrollTop = chatLog.scrollHeight;
}
