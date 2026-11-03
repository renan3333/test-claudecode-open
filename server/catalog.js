// Fonte da verdade dos preços. O navegador nunca define valores, só ids e quantidades.
const MODELS = {
  um:  { name: 'Pomar Um',     price: 5499 },
  max: { name: 'Pomar Um Max', price: 7299 },
};
const COLORS = { grafite: 'Grafite', nevoa: 'Névoa', cobre: 'Cobre', floresta: 'Floresta' };

export function findItem(id) {
  const [m, c] = String(id).split('-');
  if (!MODELS[m] || !COLORS[c]) return null;
  return { name: `${MODELS[m].name} ${COLORS[c]}`, unitAmount: Math.round(MODELS[m].price * 100) }; // centavos
}
