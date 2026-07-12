// dashboard.js — Person 4's module. Dashboard / Home screen.

App.views.dashboard = {
  async render(main) {
    main.innerHTML = `
      <div class="page-header"><h1>Dashboard</h1></div>
      <p class="page-sub">Real-time operational snapshot.</p>
      <div id="kpi-grid" class="grid cols-4" style="margin-bottom:24px;"></div>

      <div class="grid cols-2">
        <div class="card">
          <h3>Overdue returns</h3>
          <div id="overdue-list"></div>
        </div>
        <div class="card">
          <h3>Upcoming returns</h3>
          <div id="upcoming-list"></div>
        </div>
      </div>
    `;

    const data = await App.api.get('/dashboard');

    document.getElementById('kpi-grid').innerHTML = `
      <div class="kpi good"><div class="value">${data.assetsAvailable}</div><div class="label">Assets available</div></div>
      <div class="kpi warn"><div class="value">${data.assetsAllocated}</div><div class="label">Assets allocated</div></div>
      <div class="kpi alert"><div class="value">${data.underMaintenance}</div><div class="label">Under maintenance</div></div>
      <div class="kpi"><div class="value">${data.activeBookings}</div><div class="label">Active bookings</div></div>
      <div class="kpi warn"><div class="value">${data.pendingMaintenance}</div><div class="label">Pending maintenance</div></div>
      <div class="kpi alert"><div class="value">${data.overdueReturnsCount}</div><div class="label">Overdue returns</div></div>
      <div class="kpi"><div class="value">${data.upcomingReturnsCount}</div><div class="label">Upcoming returns</div></div>
    `;

    const employees = App.cache.employees.length ? App.cache.employees : await App.api.get('/employees');
    App.cache.employees = employees;
    const assets = App.cache.assets.length ? App.cache.assets : await App.api.get('/assets');
    App.cache.assets = assets;

    const renderList = (items) =>
      items.length
        ? `<table><tbody>${items
            .map(
              (al) => `<tr>
              <td class="mono">${App.utils.nameFor(al.assetId, assets)}</td>
              <td>${App.utils.nameFor(al.employeeId, employees)}</td>
              <td>${App.utils.fmtDate(al.expectedReturnDate)}</td>
            </tr>`
            )
            .join('')}</tbody></table>`
        : '<div class="empty-state">Nothing here.</div>';

    document.getElementById('overdue-list').innerHTML = renderList(data.overdueReturns);
    document.getElementById('upcoming-list').innerHTML = renderList(data.upcomingReturns);
  },
};
