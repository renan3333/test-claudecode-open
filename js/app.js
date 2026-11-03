import { initScrollEngine } from './scroll-engine.js';
import { initCanvas } from './canvas-engine.js';
import { initCart } from './cart.js';
import { initVariants } from './variants.js';

function initCaptions() {
  const caps = [...document.querySelectorAll('.caption')];
  const angle = document.getElementById('angle');
  return (p) => {
    caps.forEach((el) => el.classList.toggle('on', p >= +el.dataset.from && p < +el.dataset.to));
    angle.textContent = Math.round(p * 360);
  };
}

function initNavbar() {
  const nav = document.getElementById('navbar');
  let last = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('hidden', y > last && y > 80);
    last = y;
  }, { passive: true });
}

function initBento() {
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  const chip = document.querySelector('.c-chip'), toggle = document.getElementById('perf-toggle');
  toggle.addEventListener('click', () => {
    const perf = chip.dataset.mode !== 'perf';
    chip.dataset.mode = perf ? 'perf' : 'eco';
    toggle.setAttribute('aria-pressed', perf);
    toggle.textContent = perf ? 'Modo desempenho' : 'Modo economia';
  });

  const hours = document.getElementById('hours');
  document.getElementById('brightness').addEventListener('input', (e) => {
    hours.textContent = Math.round(30 - e.target.value * 0.14);
  });

  const finder = document.getElementById('finder'), label = document.getElementById('zoom-label');
  document.querySelectorAll('.zooms .pill').forEach((btn) => btn.addEventListener('click', () => {
    document.querySelectorAll('.zooms .pill').forEach((b) => b.classList.toggle('on', b === btn));
    finder.style.setProperty('--z', btn.dataset.z);
    label.textContent = `${btn.dataset.z}x`;
  }));
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = initCanvas('#product-canvas');
  const updateCaptions = initCaptions();

  initVariants({
    onChange: (v) => {
      canvas.loadVariant(v);
      document.documentElement.style.setProperty('--accent', v.color.accent);
    },
  });
  initCart();
  initNavbar();
  initBento();

  initScrollEngine({
    target: '#hero',
    onProgress: (p) => { canvas.render(p); updateCaptions(p); },
  });
});
