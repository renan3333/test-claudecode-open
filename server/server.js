import dotenv from 'dotenv';
dotenv.config({ override: true }); // o .env vence variáveis já definidas no ambiente (ex.: Codespaces secrets)
import express from 'express';
import Stripe from 'stripe';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findItem } from './catalog.js';

const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PORT = 3000 } = process.env;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
if (!/^(sk|rk)_(test|live)_/.test(STRIPE_SECRET_KEY || '')) {
  console.error(`STRIPE_SECRET_KEY inválida (começa com "${(STRIPE_SECRET_KEY || '').slice(0, 8)}"). Use a chave SECRETA, que começa com sk_test_ ou sk_live_.`);
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);
const app = express();
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Webhook: precisa do corpo bruto, então vem ANTES do express.json()
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Assinatura inválida: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    // TODO: marcar pedido como pago, baixar estoque, enviar e-mail. s.payment_status === 'paid' confirma o pagamento.
    console.log('Pedido pago:', s.id, s.amount_total / 100, s.currency.toUpperCase());
  }
  res.json({ received: true });
});

app.use(express.json());

app.post('/api/checkout', async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const line_items = [];
    for (const { id, qty } of items) {
      const product = findItem(id);
      if (!product || !Number.isInteger(qty) || qty < 1 || qty > 10) {
        return res.status(400).json({ error: 'Item inválido no carrinho.' });
      }
      line_items.push({
        quantity: qty,
        price_data: { currency: 'brl', unit_amount: product.unitAmount, product_data: { name: product.name } },
      });
    }
    if (!line_items.length) return res.status(400).json({ error: 'Carrinho vazio.' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      locale: 'pt-BR',
      shipping_address_collection: { allowed_countries: ['BR'] },
      phone_number_collection: { enabled: true },
      success_url: `${BASE_URL}/sucesso.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/?cancelado=1`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Não foi possível iniciar o pagamento.' });
  }
});

// Frontend estático (apenas as pastas públicas, nunca a pasta server/)
for (const dir of ['styles', 'js', 'assets']) app.use(`/${dir}`, express.static(path.join(ROOT, dir)));
app.get('/', (_req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.get('/sucesso.html', (_req, res) => res.sendFile(path.join(ROOT, 'sucesso.html')));

app.listen(PORT, () => console.log(`Loja em ${BASE_URL}`));
