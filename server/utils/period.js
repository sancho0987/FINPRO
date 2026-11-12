'use strict';
// Un "período" es el mes financiero del hogar. Con día de corte = 1 coincide con el mes calendario.
// Con día de corte = N, el período "mes M" va del día N del mes M al día N-1 del mes M+1.

const pad = (n) => String(n).padStart(2, '0');
const ymd = (y, m0, d) => `${y}-${pad(m0 + 1)}-${pad(d)}`;

function normalize(year, month0) {
  const total = year * 12 + month0;
  return { year: Math.floor(total / 12), month0: ((total % 12) + 12) % 12 };
}

function getPeriod(year, month0, cutoff = 1) {
  const s = normalize(year, month0);
  const start = ymd(s.year, s.month0, cutoff);
  let end;
  if (cutoff === 1) {
    const last = new Date(Date.UTC(s.year, s.month0 + 1, 0)).getUTCDate();
    end = ymd(s.year, s.month0, last);
  } else {
    const n = normalize(s.year, s.month0 + 1);
    end = ymd(n.year, n.month0, cutoff - 1);
  }
  return { year: s.year, month: s.month0, from: start, to: end };
}

function shiftPeriod(year, month0, delta, cutoff = 1) {
  const n = normalize(year, month0 + delta);
  return getPeriod(n.year, n.month0, cutoff);
}

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return ymd(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
}

function isValidDate(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

const todayStr = () => {
  const d = new Date();
  return ymd(d.getFullYear(), d.getMonth(), d.getDate());
};

module.exports = { getPeriod, shiftPeriod, addDays, isValidDate, todayStr };
