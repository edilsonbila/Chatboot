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

## Farmácias importadas do OpenStreetMap

Todas as farmácias de Moçambique registadas no OpenStreetMap (~135) estão integradas em `data/farmacias.json`
com `fonte: "osm"`. Para actualizar:

```bash
node scripts/importar-farmacias-osm.js            # consulta a Overpass API e regenera os dados
node scripts/importar-farmacias-osm.js --offline  # usa a última resposta guardada (data/osm-farmacias.json)
```

O script também gera `DataBase/farmacias_osm.sql` para carregar as mesmas farmácias em MySQL.
As farmácias importadas ainda não têm stock/preços registados; o chatbot mostra-as como
"stock e preço não confirmados" e lista-as em "farmácias perto de mim".

## Pedidos às farmácias próximas

Depois de perguntar por um medicamento, o utilizador pode clicar em **"Perguntar às farmácias próximas"**:
o sistema cria um pedido (`POST /pedidos`) e envia a pergunta às 5 farmácias mais próximas (raio de 25 km).
As farmácias respondem no **portal** (`/farmacia.html`) indicando disponibilidade, preço e mensagem, e a resposta
aparece no chat do utilizador (que faz polling a `GET /pedidos/:id`).

Canal de envio (variável `MENSAGEIRO`):

| Valor | Comportamento |
|---|---|
| `console` (padrão) | Regista a mensagem no log; a farmácia vê o pedido no portal. |
| `twilio` | Envia WhatsApp/SMS via Twilio. Requer `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_FROM` (ex.: `whatsapp:+14155238886`). Opcional: `BASE_URL` para o link de resposta. |

Endpoints: `POST /pedidos {pergunta, lat, lng}` · `GET /pedidos/:id` · `GET /farmacias` · `GET /farmacias/:id/pedidos` · `POST /pedidos/:id/respostas {farmacia_id, disponivel, preco, mensagem}`.
Os pedidos ficam em `data/pedidos.json` (ignorado pelo git).
