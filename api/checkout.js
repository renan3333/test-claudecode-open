import Stripe from 'stripe';
import { findItem } from './_catalog.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
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

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const base = process.env.BASE_URL || `https://${req.headers.host}`;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      locale: 'pt-BR',
      shipping_address_collection: { allowed_countries: ['BR'] },
      phone_number_collection: { enabled: true },
      success_url: `${base}/sucesso.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/?cancelado=1`,
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Não foi possível iniciar o pagamento.' });
  }
}
