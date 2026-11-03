import { brl } from './variants.js';

const KEY = 'pomar:cart';

export function initCart() {
  const $ = (id) => document.getElementById(id);
  const drawer = $('drawer'), scrim = $('scrim');
  let items = [];
  try { items = JSON.parse(localStorage.getItem(KEY)) || []; } catch { items = []; }

  const toast = (msg) => {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove('show'), 2600);
  };

  const toggle = (open) => {
    drawer.classList.toggle('open', open);
    scrim.classList.toggle('open', open);
    drawer.inert = !open;
  };

  function render() {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const badge = $('cart-count');
    badge.hidden = count === 0;
    badge.textContent = count;
    $('cart-total').textContent = brl(items.reduce((n, i) => n + i.qty * i.price, 0));
    $('cart-items').innerHTML = items.length
      ? items.map((i) => `<li><span class="dot" style="--c:${i.swatch}"></span>
          <div>${i.name}<small>${i.color} · ${brl(i.price)}</small></div>
          <div class="qty"><button data-act="dec" data-id="${i.id}" aria-label="Diminuir">−</button>${i.qty}<button data-act="inc" data-id="${i.id}" aria-label="Aumentar">+</button></div></li>`).join('')
      : '<li class="empty">Seu carrinho está vazio.</li>';
    $('checkout').disabled = !items.length;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
    render();
  }

  document.addEventListener('cart:add', (e) => {
    const found = items.find((i) => i.id === e.detail.id);
    found ? found.qty++ : items.push({ ...e.detail, qty: 1 });
    save();
    const b = $('cart-count'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
    toast(`${e.detail.name} ${e.detail.color} adicionado.`);
  });

  $('cart-items').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]'); if (!btn) return;
    const item = items.find((i) => i.id === btn.dataset.id);
    item.qty += btn.dataset.act === 'inc' ? 1 : -1;
    items = items.filter((i) => i.qty > 0);
    save();
  });

  $('cart-toggle').addEventListener('click', () => toggle(true));
  $('cart-close').addEventListener('click', () => toggle(false));
  scrim.addEventListener('click', () => toggle(false));
  addEventListener('keydown', (e) => e.key === 'Escape' && toggle(false));
  $('checkout').addEventListener('click', async () => {
    const btn = $('checkout');
    btn.disabled = true; btn.textContent = 'Redirecionando…';
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map(({ id, qty }) => ({ id, qty })) }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Falha no checkout');
      location.href = data.url; // página de pagamento hospedada pela Stripe
    } catch {
      toast('Não foi possível iniciar o pagamento. Tente de novo.');
      btn.textContent = 'Finalizar compra'; btn.disabled = !items.length;
    }
  });

  if (new URLSearchParams(location.search).has('cancelado')) {
    history.replaceState(null, '', location.pathname);
    toast('Pagamento cancelado. Seu carrinho foi mantido.');
  }

  render();
}
