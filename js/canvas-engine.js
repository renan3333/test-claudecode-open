/**
 * Renderiza o produto girando 360° sem depender de imagens (pseudo-3D procedural).
 * Para usar frames reais (assets/frames/frame-001.webp...), troque draw() por ctx.drawImage(frames[idx], ...).
 */
export function initCanvas(selector) {
  const cv = document.querySelector(selector);
  const ctx = cv.getContext('2d');
  let w = 0, h = 0, dpr = 1, p = 0;
  let v = { model: { scale: 0.9, ratio: 0.49 }, color: { body: '#3a3d42', edge: '#6b7077', accent: '#7aa2ff' } };

  const fit = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    draw();
  };
  new ResizeObserver(fit).observe(cv);

  const rr = (x, y, ww, hh, r) => { ctx.beginPath(); ctx.roundRect(x, y, ww, hh, r); };

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const { body, edge, accent } = v.color;
    const H = Math.min(h * 0.62, w * 1.2) * v.model.scale / 0.9 * (1 + 0.06 * Math.sin(p * Math.PI));
    const W = H * v.model.ratio, T = H * 0.05, R = W * 0.16, A = W / 2, b = T / 2;
    const ang = p * Math.PI * 2, c = Math.cos(ang), s = Math.sin(ang);
    const cx = w / 2, cy = h / 2;

    // sombra no chão
    ctx.save();
    ctx.translate(cx, cy + H * 0.54); ctx.scale(1, 0.12);
    const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.7);
    sh.addColorStop(0, 'rgba(0,0,0,.55)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh; ctx.fillRect(-W, -W, W * 2, W * 2);
    ctx.restore();

    const metal = (x0, x1) => {
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, edge); g.addColorStop(0.5, body); g.addColorStop(1, edge);
      return g;
    };

    // laterais (visíveis conforme o ângulo)
    const side = (x0, x1) => {
      const wd = Math.abs(x1 - x0);
      ctx.fillStyle = metal(Math.min(x0, x1), Math.max(x0, x1));
      rr(Math.min(x0, x1), cy - H / 2, wd, H, Math.min(R, wd / 2)); ctx.fill();
    };
    if (s < 0) side(cx + A * c + b * s, cx + A * c - b * s);
    if (s > 0) side(cx - A * c + b * s, cx - A * c - b * s);

    // frente ou traseira, achatada em X pelo cosseno
    const face = (fx, front) => {
      ctx.save();
      ctx.translate(fx, cy); ctx.scale(Math.abs(c), 1);
      ctx.fillStyle = metal(-A, A); rr(-A, -H / 2, W, H, R); ctx.fill();
      const m = W * 0.045;
      if (front) {
        const g = ctx.createLinearGradient(0, -H / 2, 0, H / 2);
        g.addColorStop(0, '#07080b'); g.addColorStop(0.55, accent + '88'); g.addColorStop(1, '#07080b');
        ctx.fillStyle = g; rr(-A + m, -H / 2 + m, W - 2 * m, H - 2 * m, R - m); ctx.fill();
        ctx.fillStyle = '#000'; rr(-W * 0.1, -H / 2 + m * 2, W * 0.2, W * 0.055, W * 0.03); ctx.fill();
      } else {
        const bx = -A + m * 2, by = -H / 2 + m * 2, bs = W * 0.44;
        ctx.fillStyle = 'rgba(0,0,0,.28)'; rr(bx, by, bs, bs, bs * 0.25); ctx.fill();
        ctx.fillStyle = '#0b0c0e';
        [[.27, .27], [.73, .27], [.5, .72]].forEach(([lx, ly]) => { ctx.beginPath(); ctx.arc(bx + bs * lx, by + bs * ly, bs * 0.17, 0, 7); ctx.fill(); });
        ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, H * 0.12, W * 0.08, 0, 7); ctx.stroke();
      }
      // brilho que desliza com a rotação
      const k = 0.5 + 0.5 * Math.sin(ang * 1.5);
      const g2 = ctx.createLinearGradient(-A, 0, A, 0);
      g2.addColorStop(Math.max(0, k - 0.25), 'rgba(255,255,255,0)');
      g2.addColorStop(k, 'rgba(255,255,255,.16)');
      g2.addColorStop(Math.min(1, k + 0.25), 'rgba(255,255,255,0)');
      ctx.fillStyle = g2; rr(-A, -H / 2, W, H, R); ctx.fill();
      ctx.restore();
    };
    if (c > 0.001) face(cx + b * s, true);
    else if (c < -0.001) face(cx - b * s, false);
  }

  return {
    render(progress) { p = progress; draw(); },
    loadVariant(variant) { v = variant; draw(); },
  };
}
