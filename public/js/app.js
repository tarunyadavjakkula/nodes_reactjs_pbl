// API & State helper for pure HTML pages
const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('spendwise_token');
}

function getUser() {
  const u = localStorage.getItem('spendwise_user');
  try {
    return u ? JSON.parse(u) : null;
  } catch (e) {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem('spendwise_user', JSON.stringify(user));
}

function requireAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
  }
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json();
    if (res.status === 401) {
      localStorage.removeItem('spendwise_token');
      localStorage.removeItem('spendwise_user');
      window.location.href = '/login.html';
      return null;
    }
    return data;
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
}

function formatCurrency(amount, currency = null) {
  const user = getUser();
  const curr = currency || (user && user.currency) || 'USD';
  const val = parseFloat(amount) || 0;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 2
    }).format(val);
  } catch (e) {
    return `${curr} ${val.toFixed(2)}`;
  }
}

function initTheme() {
  const saved = localStorage.getItem('spendwise_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', current);
  localStorage.setItem('spendwise_theme', current);
}

function logout() {
  localStorage.removeItem('spendwise_token');
  localStorage.removeItem('spendwise_user');
  window.location.href = '/login.html';
}

// Render dynamic user info in topbar
function renderTopbarUser() {
  const user = getUser();
  const nameEl = document.getElementById('userNameDisplay');
  const avatarEl = document.getElementById('userAvatar');
  if (user && nameEl) {
    nameEl.textContent = `${user.name} (${user.currency || 'USD'})`;
  }
  if (user && avatarEl && user.name) {
    avatarEl.textContent = user.name.charAt(0).toUpperCase();
  }
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
});
