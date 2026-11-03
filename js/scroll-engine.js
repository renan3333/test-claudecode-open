export const lerp = (a, b, t) => a + (b - a) * t;

/** Lê o scroll do alvo (0..1) e suaviza com LERP dentro de um loop rAF. */
export function initScrollEngine({ target, onProgress, ease = 0.08 }) {
  const el = document.querySelector(target);
  const k = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : ease;
  let goal = 0, current = 0, last = -1;

  const measure = () => {
    const r = el.getBoundingClientRect();
    const span = r.height - innerHeight;
    goal = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
  };
  addEventListener('scroll', measure, { passive: true });
  addEventListener('resize', measure);
  measure();
  current = goal;

  const tick = () => {
    current = Math.abs(goal - current) < 0.0002 ? goal : lerp(current, goal, k);
    if (current !== last) { last = current; onProgress(current); }
    requestAnimationFrame(tick);
  };
  tick();
}
