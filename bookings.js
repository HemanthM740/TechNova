// org.js — Person 1's module. Organization Setup screen (Admin only):
// departments, categories, employee directory + role promotion.

App.views.org = {
  async render(main) {
    main.innerHTML = `
      <div class="page-header"><h1>Org Setup</h1></div>
      <p class="page-sub">Master data everything else depends on. Admin only.</p>
      <div id="org-banner"></div>

      <div class="grid cols-2">
        <div class="card">
          <h3>Departments</h3>
          <div id="dept-list"></div>
          <form id="dept-form" class="inline-form" style="margin-top:12px;">
            <div><input type="text" id="dept-name" placeholder="New department name" required /></div>
            <button class="btn small" type="submit">Add</button>
          </form>
        </div>

        <div class="card">
          <h3>Asset Categories</h3>
          <div id="cat-list"></div>
          <form id="cat-form" class="inline-form" style="margin-top:12px;">
            <div><input type="text" id="cat-name" placeholder="New category name" required /></div>
            <button class="btn small" type="submit">Add</button>
          </form>
        </div>
      </div>

      <div class="card">
        <h3>Employee Directory</h3>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Promote to</th></tr></thead>
          <tbody id="emp-tbody"></tbody>
        </table>
      </div>
    `;

    await this.loadAll();

    document.getElementById('dept-form').addEventListener('submit', (e) => this.addDept(e));
    document.getElementById('cat-form').addEventListener('submit', (e) => this.addCat(e));
  },

  async loadAll() {
    const [depts, cats, employees] = await Promise.all([
      App.api.get('/departments'),
      App.api.get('/categories'),
      App.api.get('/employees'),
    ]);
    App.cache.departments = depts;
    App.cache.categories = cats;
    App.cache.employees = employees;

    document.getElementById('dept-list').innerHTML =
      depts.map((d) => `<div class="tag" style="margin:2px 4px 2px 0;display:inline-block;">${d.name}</div>`).join('') ||
      '<div class="empty-state">No departments yet.</div>';

    document.getElementById('cat-list').innerHTML =
      cats.map((c) => `<div class="tag" style="margin:2px 4px 2px 0;display:inline-block;">${c.name}</div>`).join('') ||
      '<div class="empty-state">No categories yet.</div>';

    document.getElementById('emp-tbody').innerHTML = employees
      .map(
        (u) => `
      <tr>
        <td>${u.name}</td>
        <td class="mono">${u.email}</td>
        <td>${App.utils.stamp(u.role)}</td>
        <td>${App.utils.stamp(u.status)}</td>
        <td>
          ${
            u.role === 'Admin'
              ? '—'
              : `
            <select data-user="${u.id}" class="promote-select" style="margin-bottom:0;padding:4px 6px;">
              <option value="Employee" ${u.role === 'Employee' ? 'selected' : ''}>Employee</option>
              <option value="DepartmentHead" ${u.role === 'DepartmentHead' ? 'selected' : ''}>Department Head</option>
              <option value="AssetManager" ${u.role === 'AssetManager' ? 'selected' : ''}>Asset Manager</option>
            </select>`
          }
        </td>
      </tr>`
      )
      .join('');

    document.querySelectorAll('.promote-select').forEach((sel) => {
      sel.addEventListener('change', async (e) => {
        try {
          await App.api.post('/auth/promote', { userId: e.target.dataset.user, role: e.target.value });
          document.getElementById('org-banner').innerHTML = App.utils.banner('Role updated.', 'success');
          this.loadAll();
        } catch (err) {
          document.getElementById('org-banner').innerHTML = App.utils.banner(err.message, 'error');
        }
      });
    });
  },

  async addDept(e) {
    e.preventDefault();
    const name = document.getElementById('dept-name').value;
    try {
      await App.api.post('/departments', { name });
      document.getElementById('dept-name').value = '';
      this.loadAll();
    } catch (err) {
      document.getElementById('org-banner').innerHTML = App.utils.banner(err.message, 'error');
    }
  },

  async addCat(e) {
    e.preventDefault();
    const name = document.getElementById('cat-name').value;
    try {
      await App.api.post('/categories', { name });
      document.getElementById('cat-name').value = '';
      this.loadAll();
    } catch (err) {
      document.getElementById('org-banner').innerHTML = App.utils.banner(err.message, 'error');
    }
  },
};
