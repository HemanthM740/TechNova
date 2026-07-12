// main.js — shared bootstrap. Wires sidebar navigation to each module's
// view (App.views.*) and handles the auth <-> app screen switch.

App.main = {
  currentView: 'dashboard',

  init() {
    App.auth.init();

    document.querySelectorAll('.nav-item').forEach((item) => {
      item.addEventListener('click', () => this.navigate(item.dataset.view));
    });

    document.getElementById('login-email').value = '';
    document.getElementById('auth-screen').hidden = false;
  },

  enterApp() {
    document.getElementById('auth-screen').hidden = true;
    document.getElementById('app').hidden = false;

    document.getElementById('who-name').textContent = App.state.user.name;
    document.getElementById('who-role').textContent = App.state.user.role;

    const isAdmin = App.state.user.role === 'Admin';
    document.querySelectorAll('[data-admin-only]').forEach((el) => {
      el.hidden = !isAdmin;
    });

    this.navigate('dashboard');
  },

  navigate(view) {
    if (!App.views[view]) return;
    this.currentView = view;
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.view === view);
    });
    const main = document.getElementById('main');
    App.views[view].render(main).catch((err) => {
      main.innerHTML = App.utils.banner(err.message || 'Something went wrong loading this view.', 'error');
    });
  },
};

document.addEventListener('DOMContentLoaded', () => App.main.init());
