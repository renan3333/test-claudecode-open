import Stripe from 'stripe';

export const config = { api: { bodyParser: false } }; // a Stripe exige o corpo bruto para validar a assinatura

async function rawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event;
  try {
    event = stripe.webhooks.constructEvent(await rawBody(req), req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Assinatura inválida: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    // TODO: marcar pedido como pago, baixar estoque, enviar e-mail (s.payment_status === 'paid')
    console.log('Pedido pago:', s.id, s.amount_total / 100, s.currency.toUpperCase());
  }
  res.status(200).json({ received: true });
}
