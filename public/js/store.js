// Estado global de la app (datos del usuario ya cargados) y bus de eventos.
import { api } from './api.js';
import { setCurrency, currentPeriod } from './utils.js';

export const app = { user: null, settings: null, categories: [], members: [], hasTransactions: false, period: null };
export const bus = new EventTarget();

export async function loadMeta() {
  const b = await api.get('/api/bootstrap');
  app.user = b.user;
  app.settings = b.settings;
  app.categories = b.categories;
  app.members = b.members;
  app.hasTransactions = b.hasTransactions;
  setCurrency(b.settings.currency);
  if (!app.period) app.period = currentPeriod(b.settings.cutoffDay);
  return b;
}

// Avisa a la vista actual que los datos cambiaron (meta = categorías/miembros/config).
export const notifyChange = (meta = false) => bus.dispatchEvent(new CustomEvent('data-changed', { detail: { meta } }));

export const catById = (id) => app.categories.find((c) => c.id === id);
export const incomeCategory = () => app.categories.find((c) => c.name.toLowerCase() === 'ingresos');
