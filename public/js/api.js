// Cliente HTTP del backend. Maneja errores, sesión expirada y la cabecera anti-CSRF.
export class ApiError extends Error {
  constructor(status, code, message, fields) { super(message); this.status = status; this.code = code; this.fields = fields || {}; }
}

let onUnauthorized = () => { window.location.href = '/login.html'; };
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(method, url, body, { silent401 = false } = {}) {
  const opts = { method, credentials: 'same-origin', headers: { 'X-Requested-With': 'FINPRO' } };
  if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  let res;
  try { res = await fetch(url, opts); }
  catch { throw new ApiError(0, 'NETWORK', 'No se pudo conectar con el servidor. Revisa tu conexión.'); }

  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const e = (data && data.error) || {};
    if (res.status === 401 && !silent401) onUnauthorized();
    throw new ApiError(res.status, e.code || 'ERROR', e.message || 'Ocurrió un error inesperado.', e.fields);
  }
  return data;
}

const qs = (params = {}) => {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') u.set(k, v); });
  const s = u.toString();
  return s ? '?' + s : '';
};

export const api = {
  get: (url, params, o) => request('GET', url + qs(params), undefined, o),
  post: (url, body = {}, o) => request('POST', url, body, o),
  put: (url, body, o) => request('PUT', url, body, o),
  patch: (url, body, o) => request('PATCH', url, body, o),
  del: (url, body, o) => request('DELETE', url + (body && body.query ? qs(body.query) : ''), body && body.query ? undefined : body, o),
  url: (path, params) => path + qs(params),
};
