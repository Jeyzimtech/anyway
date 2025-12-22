const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
let authToken = null;
let onAutoLogout = null; // Callback for automatic logout

export function setAuthToken(token) { authToken = token; }
export function setAutoLogoutCallback(callback) { onAutoLogout = callback; }
function authHeaders() { return authToken ? { Authorization: `Bearer ${authToken}` } : {}; }

// Enhanced fetch wrapper that handles automatic logout on 401
async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  
  // If unauthorized and we have a user session, trigger automatic logout
  if (res.status === 401 && authToken && onAutoLogout) {
    console.log('Session expired or unauthorized - triggering automatic logout');
    onAutoLogout();
  }
  
  return res;
}

export async function listProducts({ page = 1, pageSize = 20, q = '' } = {}) {
  const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize), q });
  const res = await apiFetch(`${API_BASE}/products?${qs.toString()}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to load products');
  return res.json();
}

export async function createProduct(payload) {
  const res = await apiFetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create product');
  return res.json();
}

export async function updateProduct(id, payload) {
  const res = await apiFetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
}

export async function deleteProduct(id) {
  const res = await apiFetch(`${API_BASE}/products/${id}`, { method: 'DELETE', headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to delete product');
  return res.json();
}

export async function register({ email, password, full_name, role }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name, role }),
  });
  if (!res.ok) throw new Error('Failed to register');
  return res.json();
}

export async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Failed to login');
  const data = await res.json();
  if (data.token) setAuthToken(data.token);
  return data;
}

// Orders API
export async function listOrders({ status } = {}) {
  const qs = status ? `?status=${status}` : '';
  const res = await fetch(`${API_BASE}/orders${qs}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to load orders');
  return res.json();
}

export async function createOrder(payload) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create order');
  return res.json();
}

export async function updateOrder(id, payload) {
  const res = await fetch(`${API_BASE}/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update order');
  return res.json();
}

export async function deleteOrder(id) {
  const res = await fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE', headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to delete order');
  return res.json();
}

// Returns API
export async function listReturns({ status } = {}) {
  const qs = status ? `?status=${status}` : '';
  const res = await fetch(`${API_BASE}/returns${qs}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to load returns');
  return res.json();
}

export async function createReturn(payload) {
  const res = await fetch(`${API_BASE}/returns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to submit return');
  return res.json();
}

export async function updateReturn(id, payload) {
  const res = await fetch(`${API_BASE}/returns/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update return');
  return res.json();
}

export async function getActiveEmployees() {
  const res = await fetch(`${API_BASE}/employees/active-today`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to load employee activity');
  return res.json();
}

export async function getLoggedOutEmployees() {
  const res = await fetch(`${API_BASE}/employees/loggedout-today`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to load logged out employees');
  return res.json();
}

export async function logEmployeeLogin(username) {
  const res = await fetch(`${API_BASE}/employees/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error('Failed to log login');
  return res.json();
}

export async function logEmployeeLogout(id) {
  const res = await fetch(`${API_BASE}/employees/logout/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to log logout');
  return res.json();
}

export async function updateEmployeeQuantitySold(id, quantity_sold) {
  const res = await fetch(`${API_BASE}/employees/quantity/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ quantity_sold }),
  });
  if (!res.ok) throw new Error('Failed to update quantity sold');
  return res.json();
}

export async function getSalesAnalyticsTrends(timeRange = 'monthly') {
  const res = await fetch(`${API_BASE}/orders/analytics/trends?timeRange=${timeRange}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to load sales trends');
  return res.json();
}

export async function getSalesAnalyticsYoY(timeRange = 'monthly') {
  const res = await fetch(`${API_BASE}/orders/analytics/yoy?timeRange=${timeRange}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to load YoY data');
  return res.json();
}

export async function getSalesAnalyticsMoM(timeRange = 'monthly') {
  const res = await fetch(`${API_BASE}/orders/analytics/mom?timeRange=${timeRange}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to load MoM data');
  return res.json();
}
export async function getCategoryInsights(timeRange = 'monthly') {
  const res = await fetch(`${API_BASE}/orders/analytics/categories?timeRange=${timeRange}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to load category insights');
  return res.json();
}

export async function getProductAnalytics(timeRange = 'monthly') {
  const res = await fetch(`${API_BASE}/orders/analytics/products?timeRange=${timeRange}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to load product analytics');
  return res.json();
}

export async function getProfitabilityAnalytics(timeRange = 'monthly') {
  const res = await fetch(`${API_BASE}/orders/analytics/profitability?timeRange=${timeRange}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to load profitability data');
  return res.json();
}

export async function getInventoryAnalytics(timeRange = 'monthly') {
  const res = await fetch(`${API_BASE}/orders/analytics/inventory?timeRange=${timeRange}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to load inventory analytics');
  return res.json();
}

export async function getExpenseAnalytics(timeRange = 'monthly') {
  const res = await fetch(`${API_BASE}/orders/analytics/expenses?timeRange=${timeRange}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to load expense analytics');
  return res.json();
}

// Settings APIs
export async function getSettings() {
  console.log('API: Fetching settings from', `${API_BASE}/settings`);
  const res = await fetch(`${API_BASE}/settings`, { headers: { ...authHeaders() } });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('API Error:', res.status, errorText);
    throw new Error(`Failed to load settings: ${res.status} ${errorText}`);
  }
  return res.json();
}

export async function updateStockThresholds(lowStockThreshold, criticalStockThreshold) {
  console.log('API: Updating stock thresholds', { lowStockThreshold, criticalStockThreshold });
  const res = await fetch(`${API_BASE}/settings/stock-thresholds`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ lowStockThreshold, criticalStockThreshold }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('API Error:', res.status, errorText);
    throw new Error(`Failed to update stock thresholds: ${res.status}`);
  }
  return res.json();
}

export async function updateSystemSettings(storeName, taxRate, currency) {
  console.log('API: Updating system settings', { storeName, taxRate, currency });
  const res = await fetch(`${API_BASE}/settings/system`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ storeName, taxRate, currency }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('API Error:', res.status, errorText);
    throw new Error(`Failed to update system settings: ${res.status}`);
  }
  return res.json();
}

export async function updateNotificationPreferences(stockAlerts, salesReports) {
  console.log('API: Updating notification preferences', { stockAlerts, salesReports });
  const res = await fetch(`${API_BASE}/settings/notifications`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ stockAlerts, salesReports }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('API Error:', res.status, errorText);
    throw new Error(`Failed to update notification preferences: ${res.status}`);
  }
  return res.json();
}


// User Management APIs
export async function getUsers() {
  const res = await fetch(`${API_BASE}/users`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to load users');
  return res.json();
}

export async function getUserStats() {
  const res = await fetch(`${API_BASE}/users/stats`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to load user stats');
  return res.json();
}

export async function getPendingApprovals() {
  const res = await fetch(`${API_BASE}/users/pending-approvals`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to load pending approvals');
  return res.json();
}

export async function approveUser(userId) {
  const res = await fetch(`${API_BASE}/users/approve/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to approve user');
  return res.json();
}

export async function rejectUser(userId) {
  const res = await fetch(`${API_BASE}/users/reject/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to reject user');
  return res.json();
}

export async function updateUser(userId, payload) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update user');
  return res.json();
}

export async function getPasswordResets() {
  const res = await fetch(`${API_BASE}/users/password-resets`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to load password resets');
  return res.json();
}

export async function requestPasswordReset(email) {
  const res = await fetch(`${API_BASE}/users/password-resets/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error('Failed to request password reset');
  return res.json();
}

export async function verifyResetCode(resetCode) {
  const res = await fetch(`${API_BASE}/users/password-resets/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ resetCode }),
  });
  if (!res.ok) throw new Error('Failed to verify reset code');
  return res.json();
}

export async function completePasswordReset(resetCode, newPasswordHash) {
  const res = await fetch(`${API_BASE}/users/password-resets/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ resetCode, newPasswordHash }),
  });
  if (!res.ok) throw new Error('Failed to complete password reset');
  return res.json();
}

export async function getUserActivity() {
  // Add cache-busting timestamp to prevent browser caching
  const timestamp = new Date().getTime();
  const res = await fetch(`${API_BASE}/users/activity?t=${timestamp}`, { 
    headers: { 
      ...authHeaders(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    } 
  });
  if (!res.ok) throw new Error('Failed to load user activity');
  return res.json();
}

export async function logUserLogin(userId, userName, userEmail, userRole) {
  const res = await fetch(`${API_BASE}/users/activity/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ userId, userName, userEmail, userRole }),
  });
  if (!res.ok) throw new Error('Failed to log login');
  return res.json();
}

export async function logUserLogout(userId) {
  const res = await fetch(`${API_BASE}/users/activity/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to log logout');
  return res.json();
}

export async function changePassword(userId, newPassword) {
  const res = await fetch(`${API_BASE}/users/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ userId, newPassword }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to change password');
  }
  return res.json();
}