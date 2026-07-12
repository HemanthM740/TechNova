// bookings.js — Person 3's module. Resource Booking screen.
// This is the "Room B2 overlap" demo centerpiece.

App.views.bookings = {
  async render(main) {
    main.innerHTML = `
      <div class="page-header"><h1>Bookings</h1></div>
      <p class="page-sub">Time-slot booking of shared resources. Overlapping requests are rejected; adjacent slots are fine.</p>
      <div id="booking-banner"></div>

      <div class="card">
        <h3>Book a resource</h3>
        <form id="booking-form" class="grid cols-3">
          <div><label>Resource</label><select id="b-resource" required></select></div>
          <div><label>Start</label><input type="datetime-local" id="b-start" required /></div>
          <div><label>End</label><input type="datetime-local" id="b-end" required /></div>
          <div style="align-self:end;"><button class="btn" type="submit">Book slot</button></div>
        </form>
      </div>

      <div class="card">
        <h3>Bookings for selected resource</h3>
        <table>
          <thead><tr><th>Resource</th><th>Start</th><th>End</th><th>Status</th><th></th></tr></thead>
          <tbody id="booking-tbody"></tbody>
        </table>
      </div>
    `;

    const resources = await App.api.get('/assets?bookable=true');
    App.cache.resources = resources;
    document.getElementById('b-resource').innerHTML = resources
      .map((r) => `<option value="${r.id}">${r.tag} — ${r.name}</option>`)
      .join('') || '<option value="">No bookable resources yet</option>';

    await this.loadBookings();

    document.getElementById('booking-form').addEventListener('submit', (e) => this.book(e));
    document.getElementById('b-resource').addEventListener('change', () => this.loadBookings());
  },

  async loadBookings() {
    const resourceId = document.getElementById('b-resource').value;
    const bookings = resourceId ? await App.api.get(`/bookings?resourceId=${resourceId}`) : [];

    document.getElementById('booking-tbody').innerHTML =
      bookings
        .slice()
        .sort((a, b) => new Date(a.start) - new Date(b.start))
        .map((b) => {
          const resource = App.cache.resources.find((r) => r.id === b.resourceId);
          const actions =
            b.status === 'Upcoming'
              ? `<button class="btn small secondary" data-cancel="${b.id}">Cancel</button>`
              : '';
          return `
          <tr>
            <td class="mono">${resource ? resource.tag : '—'}</td>
            <td>${App.utils.fmtDateTime(b.start)}</td>
            <td>${App.utils.fmtDateTime(b.end)}</td>
            <td>${App.utils.stamp(b.status)}</td>
            <td>${actions}</td>
          </tr>`;
        })
        .join('') || `<tr><td colspan="5" class="empty-state">No bookings for this resource yet.</td></tr>`;

    document.querySelectorAll('[data-cancel]').forEach((btn) => {
      btn.addEventListener('click', () => this.cancel(btn.dataset.cancel));
    });
  },

  async book(e) {
    e.preventDefault();
    const resourceId = document.getElementById('b-resource').value;
    const start = document.getElementById('b-start').value;
    const end = document.getElementById('b-end').value;
    try {
      await App.api.post('/bookings', { resourceId, start, end });
      document.getElementById('booking-banner').innerHTML = App.utils.banner('Slot booked.', 'success');
      this.loadBookings();
    } catch (err) {
      document.getElementById('booking-banner').innerHTML = App.utils.banner(err.message, 'error');
    }
  },

  async cancel(bookingId) {
    try {
      await App.api.post(`/bookings/${bookingId}/cancel`, {});
      this.loadBookings();
    } catch (err) {
      document.getElementById('booking-banner').innerHTML = App.utils.banner(err.message, 'error');
    }
  },
};
