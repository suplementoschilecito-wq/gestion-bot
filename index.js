const express = require('express');
const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const CHAT_ID = process.env.CHAT_ID;
let gastos = [];

// Recibe mensajes de Telegram
app.post('/webhook', async (req, res) => {
  const msg = req.body?.message;
  if (!msg || msg.chat.id.toString() !== CHAT_ID) return res.sendStatus(200);

  const texto = msg.text || '';
  const gasto = parsearGasto(texto);

  if (gasto) {
    gastos.push(gasto);
    await responder(msg.chat.id, `✅ Registrado:\n💸 $${gasto.monto} en ${gasto.categoria}\n📅 ${gasto.fecha}`);
  } else {
    await responder(msg.chat.id, '❌ No entendí. Escribí algo como:\n"gasté 3000 en comida"');
  }

  res.sendStatus(200);
});

// La página consulta esto
app.get('/gastos', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(gastos);
});

function parsearGasto(texto) {
  const t = texto.toLowerCase();
  const montoMatch = t.match(/(\d+(?:[.,]\d+)?)/);
  if (!montoMatch) return null;
  const monto = parseFloat(montoMatch[1].replace(',', '.'));

  const categorias = {
    'comida': ['comida','comer','almuerzo','cena','desayuno','restaurante'],
    'transporte': ['transporte','colectivo','uber','taxi','nafta','combustible'],
    'salud': ['salud','farmacia','médico','doctor','medicamento'],
    'servicios': ['servicio','luz','agua','gas','internet','teléfono'],
    'ocio': ['ocio','entretenimiento','cine','salida','bar'],
    'ropa': ['ropa','zapatillas','vestimenta'],
    'mercado': ['mercado','supermercado','almacén','kiosco'],
  };

  let categoria = 'otros';
  for (const [cat, palabras] of Object.entries(categorias)) {
    if (palabras.some(p => t.includes(p))) { categoria = cat; break; }
  }

  return {
    monto,
    categoria,
    descripcion: texto,
    fecha: new Date().toLocaleDateString('es-AR'),
    hora: new Date().toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'})
  };
}

async function responder(chatId, texto) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({chat_id: chatId, text: texto})
  });
}

app.listen(3000, () => console.log('Bot corriendo'));
