// assets.js — Person 2's module. Asset Registration & Directory screen.

App.views.assets = {
  async render(main) {
    main.innerHTML = `
      <div class="page-header"><h1>Assets</h1></div>
      <p class="page-sub">Register assets and search the registry centrally.</p>
      <div id="asset-banner"></div>

      <div class="card">
        <h3>Register a new asset</h3>
        <form id="asset-form" class="grid cols-3">
          <div><label>Name</label><input type="text" id="a-name" required /></div>
          <div><label>Category</label><select id="a-category" required></select></div>
          <div><label>Serial number</label><input type="text" id="a-serial" /></div>
          <div><label>Location</label><input type="text" id="a-location" /></div>
          <div><label>Condition</label>
            <select id="a-condition">
              <option>Good</option><option>Fair</option><option>Poor</option>
            </select>
          </div>
          <div><label>Acquisition cost</label><input type="number" id="a-cost" min="0" step="0.01" /></div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:22px;">
            <input type="checkbox" id="a-bookable" style="width:auto;margin:0;" />
            <label style="margin:0;">Shared / bookable resource</label>
          </div>
          <div style="align-self:end;"><button class="btn" type="submit">Register asset</button></div>
        </form>
      </div>

      <div class="card">
        <h3>Registry</h3>
        <div class="inline-form" style="margin-bottom:14px;">
          <div><input type="text" id="a-search" placeholder="Search by name, tag or serial…" /></div>
          <div>
            <select id="a-status-filter">
              <option value="">All statuses</option>
              <option>Available</option><option>Allocated</option><option>Reserved</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option>Lost</option><option>Retired</option><option>Disposed</option>
            </select>
          </div>
        </div>
        <table>
          <thead><tr><th>Tag</th><th>Name</th><th>Category</th><th>Location</th><th>Status</th><th>Bookable</th></tr></thead>
          <tbody id="asset-tbody"></tbody>
        </table>
      </div>
    `;

    if (!App.cache.categories.length) {
      App.cache.categories = await App.api.get('/categories');
    }
    document.getElementById('a-category').innerHTML = App.cache.categories
      .map((c) => `<option value="${c.id}">${c.name}</option>`)
      .join('');

    await this.loadAssets();

    document.getElementById('asset-form').addEventListener('submit', (e) => this.registerAsset(e));
    document.getElementById('a-search').addEventListener('input', () => this.loadAssets());
    document.getElementById('a-status-filter').addEventListener('change', () => this.loadAssets());
  },

  async loadAssets() {
    const search = document.getElementById('a-search').value;
    const status = document.getElementById('a-status-filter').value;
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    const assets = await App.api.get(`/assets?${params.toString()}`);
    App.cache.assets = assets;

    document.getElementById('asset-tbody').innerHTML =
      assets
        .map(
          (a) => `
      <tr>
        <td class="mono">${a.tag}</td>
        <td>${a.name}</td>
        <td>${App.utils.nameFor(a.category, App.cache.categories)}</td>
        <td>${a.location || '—'}</td>
        <td>${App.utils.stamp(a.status)}</td>
        <td>${a.bookable ? 'Yes' : 'No'}</td>
      </tr>`
        )
        .join('') || `<tr><td colspan="6" class="empty-state">No assets match.</td></tr>`;
  },

  async registerAsset(e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('a-name').value,
      category: document.getElementById('a-category').value,
      serialNumber: document.getElementById('a-serial').value,
      location: document.getElementById('a-location').value,
      condition: document.getElementById('a-condition').value,
      acquisitionCost: parseFloat(document.getElementById('a-cost').value || '0'),
      bookable: document.getElementById('a-bookable').checked,
    };
    try {
      const asset = await App.api.post('/assets', payload);
      document.getElementById('asset-banner').innerHTML = App.utils.banner(
        `Registered as ${asset.tag}.`, 'success'
      );
      document.getElementById('asset-form').reset();
      this.loadAssets();
    } catch (err) {
      document.getElementById('asset-banner').innerHTML = App.utils.banner(err.message, 'error');
    }
  },
};
