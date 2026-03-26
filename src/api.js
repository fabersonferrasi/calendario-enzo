const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

const getStoredToken = () => window.localStorage.getItem('agenda_enzo_token');

const request = async (url, options = {}) => {
  const headers = {
    ...DEFAULT_HEADERS,
    ...(options.headers || {}),
  };
  const token = getStoredToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (_error) {
    throw new Error('Nao foi possivel conectar ao servidor da agenda.');
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (payload?.error) {
      throw new Error(payload.error);
    }
    if (response.status === 401) {
      throw new Error('Usuario ou senha invalidos.');
    }
    if (response.status === 404 || response.status >= 500) {
      throw new Error('O painel nao conseguiu falar com a API da agenda.');
    }
    throw new Error('Nao foi possivel concluir a solicitacao.');
  }

  return payload || {};
};

export const api = {
  getCalendar: () => request('/api/calendar', { method: 'GET' }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  getAdminBootstrap: () => request('/api/admin/bootstrap', { method: 'GET' }),
  createParent: (payload) => request('/api/admin/parents', { method: 'POST', body: JSON.stringify(payload) }),
  updateParent: (id, payload) => request(`/api/admin/parents/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteParent: (id) => request(`/api/admin/parents/${id}`, { method: 'DELETE' }),
  createRule: (payload) => request('/api/admin/weekly-rules', { method: 'POST', body: JSON.stringify(payload) }),
  updateRule: (id, payload) => request(`/api/admin/weekly-rules/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteRule: (id) => request(`/api/admin/weekly-rules/${id}`, { method: 'DELETE' }),
  createActivity: (payload) => request('/api/admin/activities', { method: 'POST', body: JSON.stringify(payload) }),
  updateActivity: (id, payload) => request(`/api/admin/activities/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteActivity: (id) => request(`/api/admin/activities/${id}`, { method: 'DELETE' }),
  updateWeekendConfig: (payload) => request('/api/admin/weekend-config', { method: 'PUT', body: JSON.stringify(payload) }),
};
