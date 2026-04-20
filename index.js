const express = require('express');
const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const CHAT_ID = process.env.CHAT_ID;
let gastos = [];
let ingresos = [];

app.post('/webhook', async (req, res) => {
  const msg = req.body?.message;
  if (!msg || msg.chat.id.toString() !== CHAT_ID) return res.sendStatus(200);

  const texto = msg.text || '';
  const t = texto.toLowerCase();

  if (esIngreso(t)) {
    const ingreso = parsearIngreso(texto);
    if (ingreso) {
      ingresos.push(ingreso);
      await responder(msg.chat.id, `✅ Ingreso registrado:\n💰 $${ingreso.monto} — ${ingreso.categoria}\n📅 ${ingreso.fecha}`);
    } else {
      await responder(msg.chat.id, '❌ No entendí el monto. Escribí algo como:\n"gané 5000 por freelance"');
    }
  } else {
    const gasto = parsearGasto(texto);
    if (gasto) {
      gastos.push(gasto);
      await responder(msg.chat.id, `✅ Gasto registrado:\n💸 $${gasto.monto} en ${gasto.categoria}\n📅 ${gasto.fecha}`);
    } else {
      await responder(msg.chat.id, '❌ No entendí. Ejemplos:\n"gasté 3000 en comida"\n"gané 5000 por freelance"');
    }
  }

  res.sendStatus(200);
});

app.get('/gastos', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(gastos);
});

app.get('/ingresos', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(ingresos);
});

function esIngreso(t) {
  const palabras = ['gané','gane','cobré','cobre','recibí','recibi','me pagaron','me dieron','entró','entro','ingresé','ingrese'];
  return palabras.some(p => t.includes(p));
}

function parsearGasto(texto) {
  const t = texto.toLowerCase();
  const montoMatch = t.match(/(\d+(?:[.,]\d+)?)/);
  if (!montoMatch) return null;
  const monto = parseFloat(montoMatch[1].replace(',', '.'));

  const categorias = {
    'comida':      ['comida','comer','almuerzo','cena','desayuno','restaurante','pizza','empanada'],
    'transporte':  ['transporte','colectivo','uber','taxi','nafta','combustible','remis'],
    'salud':       ['salud','farmacia','médico','doctor','medicamento','medicina'],
    'servicios':   ['servicio','luz','agua','gas','internet','teléfono','celular'],
    'ocio':        ['ocio','entretenimiento','cine','salida','bar','disco'],
    'ropa':        ['ropa','zapatillas','vestimenta','ropa','calzado'],
    'mercado':     ['mercado','supermercado','almacén','kiosco','super'],
  };

  let categoria = 'otros';
  for (const [cat, palabras] of Object.entries(categorias)) {
    if (palabras.some(p => t.includes(p))) { categoria = cat; break; }
  }

  return { monto, categoria, descripcion: texto, fecha: new Date().toLocaleDateString('es-AR'), hora: new Date().toLocaleTimeString('es-AR', {hour:'2-digit',minute:'2-digit'}) };
}

function parsearIngreso(texto) {
  const t = texto.toLowerCase();
  const montoMatch = t.match(/(\d+(?:[.,]\d+)?)/);
  if (!montoMatch) return null;
  const monto = parseFloat(montoMatch[1].replace(',', '.'));

  const categorias = {
    'freelance': ['freelance','trabajo','diseño','proyecto','cliente','laburo extra'],
    'regalo':    ['regalo','regalaron','cumpleaños','presente'],
    'alquiler':  ['alquiler','alquilé','renta'],
    'inversion': ['inversion','inversión','dividendo','crypto','accion'],
    'prestamo':  ['prestamo','préstamo','me prestaron','devolucion','devolución'],
    'sueldo':    ['sueldo','salario','jornal','quincena'],
  };

  let categoria = 'otros';
  for (const [cat, palabras] of Object.entries(categorias)) {
    if (palabras.some(p => t.includes(p))) { categoria = cat; break; }
  }

  return { monto, categoria, descripcion: texto, fecha: new Date().toLocaleDateString('es-AR'), hora: new Date().toLocaleTimeString('es-AR', {hour:'2-digit',minute:'2-digit'}) };
}

async function responder(chatId, texto) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({chat_id: chatId, text: texto})
  });
}

app.listen(3000, () => console.log('Bot corriendo'));
