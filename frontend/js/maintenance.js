// maintenance.js — Person 4's module. Maintenance Management screen.

App.views.maintenance = {
  async render(main) {
    main.innerHTML = `
      <div class="page-header"><h1>Maintenance</h1></div>
      <p class="page-sub">Requests must be approved before repair work starts. Approval flips the asset to Under Maintenance.</p>
      <div id="maint-banner"></div>

      <div class="card">
        <h3>Raise a request</h3>
        <form id="maint-form" class="grid cols-3">
          <div><label>Asset</label><select id="m-asset" required></select></div>
          <div><label>Priority</label>
            <select id="m-priority"><option>Low</option><option selected>Medium</option><option>High</option></select>
          </div>
          <div><label>Issue</label><input type="text" id="m-issue" required /></div>
          <div style="align-self:end;"><button class="btn" type="submit">Raise request</button></div>
        </form>
      </div>

      <div class="card">
        <h3>Requests</h3>
        <table>
          <thead><tr><th>Asset</th><th>Issue</th><th>Priority</th><th>Status</th><th></th></tr></thead>
          <tbody id="maint-tbody"></tbody>
        </table>
      </div>
    `;

    const assets = await App.api.get('/assets');
    App.cache.assets = assets;
    document.getElementById('m-asset').innerHTML = assets
      .map((a) => `<option value="${a.id}">${a.tag} — ${a.name}</option>`)
      .join('');

    await this.loadRequests();
    document.getElementById('maint-form').addEventListener('submit', (e) => this.raise(e));
  },

  async loadRequests() {
    const requests = await App.api.get('/maintenance');
    const canManage = ['Admin', 'AssetManager'].includes(App.state.user.role);

    document.getElementById('maint-tbody').innerHTML =
      requests
        .slice()
        .reverse()
        .map((m) => {
          const asset = App.cache.assets.find((a) => a.id === m.assetId);
          let actions = '';
          if (canManage && m.status === 'Pending') {
            actions = `
              <button class="btn small" data-approve="${m.id}">Approve</button>
              <button class="btn small secondary" data-reject="${m.id}">Reject</button>`;
          } else if (canManage && m.status === 'Approved') {
            actions = `<button class="btn small" data-resolve="${m.id}">Mark resolved</button>`;
          }
          return `
          <tr>
            <td class="mono">${asset ? asset.tag : '—'}</td>
            <td>${m.issue}</td>
            <td>${m.priority}</td>
            <td>${App.utils.stamp(m.status)}</td>
            <td>${actions}</td>
          </tr>`;
        })
        .join('') || `<tr><td colspan="5" class="empty-state">No maintenance requests yet.</td></tr>`;

    document.querySelectorAll('[data-approve]').forEach((b) => b.addEventListener('click', () => this.act(b.dataset.approve, 'approve')));
    document.querySelectorAll('[data-reject]').forEach((b) => b.addEventListener('click', () => this.act(b.dataset.reject, 'reject')));
    document.querySelectorAll('[data-resolve]').forEach((b) => b.addEventListener('click', () => this.act(b.dataset.resolve, 'resolve')));
  },

  async raise(e) {
    e.preventDefault();
    const payload = {
      assetId: document.getElementById('m-asset').value,
      priority: document.getElementById('m-priority').value,
      issue: document.getElementById('m-issue').value,
    };
    try {
      await App.api.post('/maintenance', payload);
      document.getElementById('maint-banner').innerHTML = App.utils.banner('Request raised.', 'success');
      document.getElementById('maint-form').reset();
      this.loadRequests();
    } catch (err) {
      document.getElementById('maint-banner').innerHTML = App.utils.banner(err.message, 'error');
    }
  },

  async act(requestId, action) {
    try {
      await App.api.post(`/maintenance/${requestId}/${action}`, {});
      this.loadRequests();
    } catch (err) {
      document.getElementById('maint-banner').innerHTML = App.utils.banner(err.message, 'error');
    }
  },
};
