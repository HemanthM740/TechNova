// api.js — shared fetch wrapper + global namespace used by every module.
// Every person's module attaches its views onto window.App.views so files
// stay independent and mergeable.

window.App = {
  state: {
    token: null,
    user: null,
  },
  views: {},
  cache: { departments: [], categories: [], employees: [], assets: [] },
};

App.api = {
  async request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (App.state.token) headers.Authorization = `Bearer ${App.state.token}`;
    const res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({ success: false, error: 'Invalid server response' }));
    if (!res.ok) {
      const err = new Error(json.error || 'Request failed');
      err.data = json.data;
      err.status = res.status;
      throw err;
    }
    return json.data;
  },
  get(path) { return this.request('GET', path); },
  post(path, body) { return this.request('POST', path, body); },
  patch(path, body) { return this.request('PATCH', path, body); },
};

App.utils = {
  fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  },
  fmtDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  stamp(status) {
    const cls = String(status || '').replace(/\s+/g, '');
    return `<span class="stamp ${cls}">${status || '—'}</span>`;
  },
  nameFor(id, list) {
    const item = (list || []).find((x) => x.id === id);
    return item ? (item.name || item.title) : '—';
  },
  el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  },
  banner(message, type) {
    return `<div class="banner ${type}">${message}</div>`;
  },
};
