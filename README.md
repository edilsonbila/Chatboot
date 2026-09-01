# Assistente de Farmácias — Moçambique

Chatbot que ajuda o cliente a encontrar em que farmácias existe um medicamento,
mostrando as farmácias mais próximas do utilizador (por GPS ou pela cidade indicada na pergunta) e o preço em MZN.

## Executar

```bash
npm start        # http://localhost:3000
npm test
```

Não precisa de dependências externas (Node.js >= 18).

## Como funciona

- `server.js` — servidor HTTP que serve o frontend e o endpoint `GET /chatbot?pergunta=...&lat=...&lng=...`
- `chatbot.js` — lógica do assistente: reconhece o medicamento (nome ou sinónimo/marca), a cidade mencionada
  ou as coordenadas do browser, calcula a distância (Haversine) e devolve as 3 farmácias mais próximas com preço.
- `data/farmacias.json` — medicamentos, farmácias (Maputo, Matola, Xai-Xai, Inhambane, Beira, Chimoio, Tete,
  Quelimane, Nampula, Nacala, Pemba, Lichinga), stock/preços e localidades.
- `DataBase/farmacia_chatbot.sql` — esquema MySQL equivalente (tabelas `farmacias` e `estoque`) com consulta de proximidade.

Exemplos de perguntas: "Onde tem Paracetamol em Nampula?", "Quanto custa Coartem perto de mim?", "Tem brufen?".
