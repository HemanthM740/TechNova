// auth.js — Person 1's module (frontend half of Auth).
// Handles the login/signup screen and session bootstrapping.

App.auth = {
  init() {
    document.getElementById('tab-login').addEventListener('click', () => this.showTab('login'));
    document.getElementById('tab-signup').addEventListener('click', () => this.showTab('signup'));
    document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('signup-form').addEventListener('submit', (e) => this.handleSignup(e));
    document.getElementById('logout-btn').addEventListener('click', (e) => {
      e.preventDefault();
      this.logout();
    });
  },

  showTab(which) {
    document.getElementById('tab-login').classList.toggle('active', which === 'login');
    document.getElementById('tab-signup').classList.toggle('active', which === 'signup');
    document.getElementById('login-form').hidden = which !== 'login';
    document.getElementById('signup-form').hidden = which !== 'signup';
    document.getElementById('auth-banner').innerHTML = '';
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
      const data = await App.api.post('/auth/login', { email, password });
      App.state.token = data.token;
      App.state.user = data.user;
      App.main.enterApp();
    } catch (err) {
      document.getElementById('auth-banner').innerHTML = App.utils.banner(err.message, 'error');
    }
  },

  async handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    try {
      await App.api.post('/auth/signup', { name, email, password });
      document.getElementById('auth-banner').innerHTML = App.utils.banner(
        'Account created as Employee. You can now log in.', 'success'
      );
      this.showTab('login');
      document.getElementById('login-email').value = email;
    } catch (err) {
      document.getElementById('auth-banner').innerHTML = App.utils.banner(err.message, 'error');
    }
  },

  logout() {
    App.api.post('/auth/logout', {}).catch(() => {});
    App.state.token = null;
    App.state.user = null;
    document.getElementById('app').hidden = true;
    document.getElementById('auth-screen').hidden = false;
  },
};
