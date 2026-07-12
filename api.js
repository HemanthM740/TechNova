// allocations.js — Person 2's module. Allocation & Transfer screen.
// This is the "Priya / Raj" conflict-block demo centerpiece.

App.views.allocations = {
  async render(main) {
    main.innerHTML = `
      <div class="page-header"><h1>Allocations</h1></div>
      <p class="page-sub">Who holds what. Allocating an already-held asset is blocked and offers a transfer instead.</p>
      <div id="alloc-banner"></div>

      <div class="card">
        <h3>Allocate an asset</h3>
        <form id="alloc-form" class="grid cols-3">
          <div><label>Asset</label><select id="al-asset" required></select></div>
          <div><label>Employee</label><select id="al-employee" required></select></div>
          <div><label>Expected return date (optional)</label><input type="date" id="al-return" /></div>
          <div style="align-self:end;"><button class="btn" type="submit">Allocate</button></div>
        </form>
        <div id="conflict-box"></div>
      </div>

      <div class="card">
        <h3>Active &amp; past allocations</h3>
        <table>
          <thead><tr><th>Asset</th><th>Employee</th><th>Allocated</th><th>Expected return</th><th>Status</th><th></th></tr></thead>
          <tbody id="alloc-tbody"></tbody>
        </table>
      </div>
    `;

    const [assets, employees] = await Promise.all([
      App.api.get('/assets'),
      App.api.get('/employees'),
    ]);
    App.cache.assets = assets;
    App.cache.employees = employees;

    document.getElementById('al-asset').innerHTML = assets
      .map((a) => `<option value="${a.id}">${a.tag} — ${a.name} (${a.status})</option>`)
      .join('');
    document.getElementById('al-employee').innerHTML = employees
      .map((u) => `<option value="${u.id}">${u.name}</option>`)
      .join('');

    await this.loadAllocations();
    document.getElementById('alloc-form').addEventListener('submit', (e) => this.allocate(e));
  },

  async loadAllocations() {
    const allocations = await App.api.get('/allocations');
    document.getElementById('alloc-tbody').innerHTML =
      allocations
        .slice()
        .reverse()
        .map((al) => {
          const asset = App.cache.assets.find((a) => a.id === al.assetId);
          const emp = App.cache.employees.find((u) => u.id === al.employeeId);
          const actions =
            al.status === 'Active'
              ? `<button class="btn small secondary" data-return="${al.id}">Return</button>`
              : '';
          return `
          <tr>
            <td class="mono">${asset ? asset.tag : '—'}</td>
            <td>${emp ? emp.name : '—'}</td>
            <td>${App.utils.fmtDate(al.allocatedAt)}</td>
            <td>${App.utils.fmtDate(al.expectedReturnDate)}</td>
            <td>${App.utils.stamp(al.status)}</td>
            <td>${actions}</td>
          </tr>`;
        })
        .join('') || `<tr><td colspan="6" class="empty-state">No allocations yet.</td></tr>`;

    document.querySelectorAll('[data-return]').forEach((btn) => {
      btn.addEventListener('click', () => this.returnAsset(btn.dataset.return));
    });
  },

  async allocate(e) {
    e.preventDefault();
    document.getElementById('conflict-box').innerHTML = '';
    const assetId = document.getElementById('al-asset').value;
    const employeeId = document.getElementById('al-employee').value;
    const expectedReturnDate = document.getElementById('al-return').value || null;

    try {
      await App.api.post('/allocations', { assetId, employeeId, expectedReturnDate });
      document.getElementById('alloc-banner').innerHTML = App.utils.banner('Asset allocated.', 'success');
      this.refreshAssetOptions();
      this.loadAllocations();
    } catch (err) {
      if (err.status === 409 && err.data && err.data.heldBy) {
        document.getElementById('conflict-box').innerHTML = `
          <div class="banner error">
            Blocked — currently held by <strong>${err.data.heldBy.name}</strong>.
            <button class="btn small" style="margin-left:10px;" id="transfer-btn">Request transfer to selected employee</button>
          </div>`;
        document.getElementById('transfer-btn').addEventListener('click', () =>
          this.transfer(err.data.allocationId, employeeId, expectedReturnDate)
        );
      } else {
        document.getElementById('alloc-banner').innerHTML = App.utils.banner(err.message, 'error');
      }
    }
  },

  async transfer(allocationId, toEmployeeId, expectedReturnDate) {
    try {
      await App.api.post(`/allocations/${allocationId}/transfer`, { toEmployeeId, expectedReturnDate });
      document.getElementById('conflict-box').innerHTML = '';
      document.getElementById('alloc-banner').innerHTML = App.utils.banner('Transferred to new employee.', 'success');
      this.refreshAssetOptions();
      this.loadAllocations();
    } catch (err) {
      document.getElementById('conflict-box').innerHTML = App.utils.banner(err.message, 'error');
    }
  },

  async returnAsset(allocationId) {
    try {
      await App.api.post(`/allocations/${allocationId}/return`, {});
      document.getElementById('alloc-banner').innerHTML = App.utils.banner('Asset returned.', 'success');
      this.refreshAssetOptions();
      this.loadAllocations();
    } catch (err) {
      document.getElementById('alloc-banner').innerHTML = App.utils.banner(err.message, 'error');
    }
  },

  async refreshAssetOptions() {
    const assets = await App.api.get('/assets');
    App.cache.assets = assets;
    document.getElementById('al-asset').innerHTML = assets
      .map((a) => `<option value="${a.id}">${a.tag} — ${a.name} (${a.status})</option>`)
      .join('');
  },
};
