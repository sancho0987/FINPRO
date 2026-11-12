// Gráficos con Chart.js, con colores que siguen el tema activo.
import { moneyCompact, money } from './utils.js';

const registry = {};
export function palette() {
  const cs = getComputedStyle(document.documentElement);
  const g = (n) => cs.getPropertyValue(n).trim();
  return { text: g('--text-2'), faint: g('--text-3'), grid: g('--line'), brand: g('--brand'), danger: g('--danger'), info: g('--info'), warn: g('--warn'), surface: g('--surface') };
}
export function draw(id, build) {
  if (registry[id]) { registry[id].destroy(); delete registry[id]; }
  const canvas = document.getElementById(id);
  if (!canvas || !window.Chart) return null;
  const C = window.Chart;
  C.defaults.font.family = "'Sora', system-ui, sans-serif";
  C.defaults.font.size = 11;
  const p = palette();
  registry[id] = new C(canvas, build(p));
  return registry[id];
}
export function destroyAll() {
  Object.keys(registry).forEach((k) => { registry[k].destroy(); delete registry[k]; });
}
export const axes = (p, { y = true } = {}) => ({
  x: { grid: { display: false }, border: { display: false }, ticks: { color: p.faint } },
  y: { display: y, beginAtZero: true, grid: { color: p.grid }, border: { display: false }, ticks: { color: p.faint, maxTicksLimit: 5, callback: (v) => moneyCompact(v) } },
});
export const tooltip = (p) => ({
  backgroundColor: p.surface, titleColor: p.text, bodyColor: p.text, borderColor: p.grid, borderWidth: 1, padding: 10, cornerRadius: 10, displayColors: true, boxPadding: 4,
  callbacks: { label: (c) => ` ${c.dataset.label ? c.dataset.label + ': ' : ''}${money(c.parsed.y ?? c.parsed)}` },
});
