export const PRODUCT = {
  models: [
    { id: 'um',  name: 'Pomar Um',     size: '6,1"', price: 5499, scale: 0.9, ratio: 0.49 },
    { id: 'max', name: 'Pomar Um Max', size: '6,9"', price: 7299, scale: 1,   ratio: 0.5 },
  ],
  colors: [
    { id: 'grafite',  name: 'Grafite',  body: '#3a3d42', edge: '#6b7077', accent: '#7aa2ff' },
    { id: 'nevoa',    name: 'Névoa',    body: '#d9dde2', edge: '#f4f5f7', accent: '#ff9ec7' },
    { id: 'cobre',    name: 'Cobre',    body: '#b8795a', edge: '#e3a887', accent: '#ffd36b' },
    { id: 'floresta', name: 'Floresta', body: '#2f4a3d', edge: '#6f9582', accent: '#9be8b5' },
  ],
};

export const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function initVariants({ onChange }) {
  const $ = (id) => document.getElementById(id);
  const state = { model: PRODUCT.models[0], color: PRODUCT.colors[0] };

  $('models').innerHTML = PRODUCT.models.map((m) =>
    `<button class="opt" role="radio" data-model="${m.id}"><span>${m.name}</span><small>${m.size} · ${brl(m.price)}</small></button>`).join('');
  $('colors').innerHTML = PRODUCT.colors.map((c) =>
    `<button class="swatch" role="radio" data-color="${c.id}" aria-label="${c.name}" style="--c:${c.body}"></button>`).join('');

  function sync() {
    const { model, color } = state;
    document.querySelectorAll('[data-model]').forEach((b) => b.setAttribute('aria-checked', b.dataset.model === model.id));
    document.querySelectorAll('[data-color]').forEach((b) => b.setAttribute('aria-checked', b.dataset.color === color.id));
    $('color-name').textContent = color.name;
    $('price').textContent = brl(model.price);
    const p = $('preview');
    p.style.setProperty('--body', color.body);
    p.style.setProperty('--edge', color.edge);
    p.style.setProperty('--s', model.scale);
    onChange({ model, color, id: `${model.id}-${color.id}` });
  }

  document.addEventListener('click', (e) => {
    const m = e.target.closest('[data-model]'), c = e.target.closest('[data-color]');
    if (m) { state.model = PRODUCT.models.find((x) => x.id === m.dataset.model); sync(); }
    if (c) { state.color = PRODUCT.colors.find((x) => x.id === c.dataset.color); sync(); }
  });

  $('add-to-cart').addEventListener('click', () => {
    const { model, color } = state;
    document.dispatchEvent(new CustomEvent('cart:add', {
      detail: { id: `${model.id}-${color.id}`, name: model.name, color: color.name, swatch: color.body, price: model.price },
    }));
  });

  sync();
}
