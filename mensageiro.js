// Envio de mensagens às farmácias. Provider escolhido por variáveis de ambiente:
//   MENSAGEIRO=console (padrão)  -> apenas regista no log; a farmácia vê o pedido no portal (/farmacia.html)
//   MENSAGEIRO=twilio            -> WhatsApp/SMS via Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM)
//                                   TWILIO_FROM ex.: "whatsapp:+14155238886" ou "+1415..."

function normalizarTelefone(telefone) {
    if (!telefone) return null;
    let digitos = String(telefone).replace(/[^\d+]/g, '');
    if (!digitos.startsWith('+')) digitos = digitos.startsWith('258') ? `+${digitos}` : `+258${digitos.replace(/^0/, '')}`;
    return /^\+\d{9,15}$/.test(digitos) ? digitos : null;
}

function providerConsole() {
    return {
        nome: 'console',
        async enviar({ farmacia, texto }) {
            console.log(`[mensagem -> ${farmacia.nome} (${farmacia.telefone || 'sem telefone'})] ${texto}`);
            return { estado: 'portal', detalhe: 'Disponível no portal da farmácia' };
        },
    };
}

function providerTwilio() {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const de = process.env.TWILIO_FROM;
    if (!sid || !token || !de) throw new Error('MENSAGEIRO=twilio requer TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_FROM');
    const whatsapp = de.startsWith('whatsapp:');
    return {
        nome: 'twilio',
        async enviar({ farmacia, texto }) {
            const numero = normalizarTelefone(farmacia.telefone);
            if (!numero) return { estado: 'portal', detalhe: 'Farmácia sem telefone; disponível apenas no portal' };
            const corpo = new URLSearchParams({ From: de, To: whatsapp ? `whatsapp:${numero}` : numero, Body: texto });
            const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
                method: 'POST',
                headers: {
                    Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: corpo,
            });
            if (!res.ok) return { estado: 'falhou', detalhe: `Twilio ${res.status}` };
            const json = await res.json();
            return { estado: 'enviada', detalhe: json.sid };
        },
    };
}

function criarMensageiro() {
    return (process.env.MENSAGEIRO || 'console') === 'twilio' ? providerTwilio() : providerConsole();
}

module.exports = { criarMensageiro, normalizarTelefone };
