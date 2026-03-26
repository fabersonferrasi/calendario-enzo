const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

const STORAGE_KEY = 'agenda_enzo_local_db';
const SESSION_KEY = 'agenda_enzo_token';
const LOCAL_TOKEN = 'local-admin-token';

const initialData = {
  parents: [
    { id: 1, name: 'Faberson', roleKey: 'pai', colorKey: 'blue' },
    { id: 2, name: 'Juliana', roleKey: 'mae', colorKey: 'rose' },
  ],
  weeklyRules: [
    {
      id: 1,
      weekday: 1,
      custodyType: 'exchange',
      label: 'Troca (Pai -> Mae)',
      primaryParentId: 1,
      secondaryParentId: 2,
      schoolParentId: 1,
      pickupText: 'Juliana busca as 16:00h',
      stripeMode: 'gradient-blue-rose',
      highlightColor: 'slate',
      activities: [
        { id: 1, weeklyRuleId: 1, timeLabel: '07:30h', title: 'Escola (Pai leva)', iconKey: 'graduation', sortOrder: 1 },
        { id: 2, weeklyRuleId: 1, timeLabel: '16:00h', title: 'Saida (Mae busca)', iconKey: 'user', sortOrder: 2 },
        { id: 3, weeklyRuleId: 1, timeLabel: '19:00h', title: 'Jiu-Jitsu', iconKey: 'activity', sortOrder: 3 },
      ],
    },
    {
      id: 2,
      weekday: 2,
      custodyType: 'parent',
      label: 'Mae (Juliana)',
      primaryParentId: 2,
      secondaryParentId: null,
      schoolParentId: 2,
      pickupText: '',
      stripeMode: 'solid',
      highlightColor: 'rose',
      activities: [
        { id: 4, weeklyRuleId: 2, timeLabel: '07:30h', title: 'Escola (Mae leva)', iconKey: 'graduation', sortOrder: 1 },
        { id: 5, weeklyRuleId: 2, timeLabel: '13:00h', title: 'Reforco Pedagogico', iconKey: 'book', sortOrder: 2 },
      ],
    },
    {
      id: 3,
      weekday: 3,
      custodyType: 'exchange',
      label: 'Troca (Mae -> Pai)',
      primaryParentId: 2,
      secondaryParentId: 1,
      schoolParentId: 2,
      pickupText: 'Faberson busca as 14:00h',
      stripeMode: 'gradient-rose-blue',
      highlightColor: 'slate',
      activities: [
        { id: 6, weeklyRuleId: 3, timeLabel: '07:30h', title: 'Escola (Mae leva)', iconKey: 'graduation', sortOrder: 1 },
        { id: 7, weeklyRuleId: 3, timeLabel: '13:00h', title: 'Reforco', iconKey: 'book', sortOrder: 2 },
        { id: 8, weeklyRuleId: 3, timeLabel: '14:00h', title: 'Saida (Pai busca)', iconKey: 'user', sortOrder: 3 },
        { id: 9, weeklyRuleId: 3, timeLabel: '19:00h', title: 'Jiu-Jitsu', iconKey: 'activity', sortOrder: 4 },
      ],
    },
    {
      id: 4,
      weekday: 4,
      custodyType: 'exchange',
      label: 'Troca (Pai -> Mae)',
      primaryParentId: 1,
      secondaryParentId: 2,
      schoolParentId: 1,
      pickupText: 'Juliana busca as 12:30h',
      stripeMode: 'gradient-blue-rose',
      highlightColor: 'slate',
      activities: [
        { id: 10, weeklyRuleId: 4, timeLabel: '07:30h', title: 'Escola (Pai leva)', iconKey: 'graduation', sortOrder: 1 },
        { id: 11, weeklyRuleId: 4, timeLabel: '12:30h', title: 'Saida (Mae busca)', iconKey: 'user', sortOrder: 2 },
        { id: 12, weeklyRuleId: 4, timeLabel: '16:00h', title: 'Psicologa', iconKey: 'heart', sortOrder: 3 },
      ],
    },
    {
      id: 5,
      weekday: 5,
      custodyType: 'exchange',
      label: 'Troca (Mae -> Pai)',
      primaryParentId: 2,
      secondaryParentId: 1,
      schoolParentId: 2,
      pickupText: 'Faberson busca as 12:30h',
      stripeMode: 'gradient-rose-blue',
      highlightColor: 'slate',
      activities: [
        { id: 13, weeklyRuleId: 5, timeLabel: '07:30h', title: 'Escola (Mae leva)', iconKey: 'graduation', sortOrder: 1 },
        { id: 14, weeklyRuleId: 5, timeLabel: '12:30h', title: 'Saida (Pai busca)', iconKey: 'user', sortOrder: 2 },
        { id: 15, weeklyRuleId: 5, timeLabel: '19:00h', title: 'Jiu-Jitsu', iconKey: 'activity', sortOrder: 3 },
      ],
    },
    {
      id: 6,
      weekday: 6,
      custodyType: 'parent',
      label: 'Pai (Faberson)',
      primaryParentId: 1,
      secondaryParentId: null,
      schoolParentId: null,
      pickupText: '',
      stripeMode: 'solid',
      highlightColor: 'blue',
      activities: [
        { id: 16, weeklyRuleId: 6, timeLabel: 'Dia todo', title: 'Tempo livre', iconKey: 'heart', sortOrder: 1 },
      ],
    },
    {
      id: 7,
      weekday: 0,
      custodyType: 'parent',
      label: 'Pai (Faberson)',
      primaryParentId: 1,
      secondaryParentId: null,
      schoolParentId: null,
      pickupText: '',
      stripeMode: 'solid',
      highlightColor: 'blue',
      activities: [
        { id: 17, weeklyRuleId: 7, timeLabel: 'Dia todo', title: 'Tempo livre', iconKey: 'heart', sortOrder: 1 },
      ],
    },
  ],
  weekendConfig: {
    id: 1,
    occurrence: 2,
    startWeekday: 5,
    durationDays: 3,
    parentId: 2,
    label: 'Mae (FDS especial)',
    pickupText: 'Mae busca para o FDS',
    highlightColor: 'rose',
  },
  childProfile: {
    id: 1,
    displayName: 'Enzo',
  },
  adminUser: {
    id: 1,
    username: 'admin',
    password: 'admin123',
    displayName: 'Administrador',
  },
};

const getStoredToken = () => window.localStorage.getItem(SESSION_KEY);

const clone = (value) => JSON.parse(JSON.stringify(value));
const migrateLocalDb = (db) => {
  if (!db?.childProfile || !Object.prototype.hasOwnProperty.call(db.childProfile, 'photoUrl')) {
    return { changed: false, value: db };
  }

  const { photoUrl: _photoUrl, ...childProfile } = db.childProfile;
  return {
    changed: true,
    value: {
      ...db,
      childProfile,
    },
  };
};

const getLocalDb = () => {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    const migrated = migrateLocalDb(parsed);
    if (migrated.changed) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated.value));
    }
    return migrated.value;
  }
  const seeded = clone(initialData);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
};

const setLocalDb = (value) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    if (error?.name === 'QuotaExceededError') {
      throw new Error('Nao foi possivel salvar os dados no navegador.');
    }
    throw error;
  }
  return value;
};

const buildCalendarPayload = (db) => ({
  meta: {
    databasePath: 'browser-local-storage',
    generatedAt: new Date().toISOString(),
  },
  parents: clone(db.parents),
  weeklyRules: clone(db.weeklyRules),
  weekendConfig: clone(db.weekendConfig),
  childProfile: clone(db.childProfile),
});

const ensureAuthenticated = () => {
  if (getStoredToken() !== LOCAL_TOKEN) {
    throw new Error('Nao autenticado.');
  }
};

const nextId = (items) => items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;

const normalizeRule = (payload, current = {}) => ({
  id: current.id,
  weekday: Number(payload.weekday),
  custodyType: String(payload.custodyType || ''),
  label: String(payload.label || ''),
  primaryParentId: payload.primaryParentId === null || payload.primaryParentId === '' ? null : Number(payload.primaryParentId),
  secondaryParentId: payload.secondaryParentId === null || payload.secondaryParentId === '' ? null : Number(payload.secondaryParentId),
  schoolParentId: payload.schoolParentId === null || payload.schoolParentId === '' ? null : Number(payload.schoolParentId),
  pickupText: String(payload.pickupText || ''),
  stripeMode: String(payload.stripeMode || 'solid'),
  highlightColor: String(payload.highlightColor || 'slate'),
  activities: current.activities || [],
});

const normalizeActivity = (payload, current = {}) => ({
  id: current.id,
  weeklyRuleId: Number(payload.weeklyRuleId),
  timeLabel: String(payload.timeLabel || ''),
  title: String(payload.title || ''),
  iconKey: String(payload.iconKey || 'heart'),
  sortOrder: Number(payload.sortOrder || 0),
});

const localApi = {
  getCalendar: async () => buildCalendarPayload(getLocalDb()),
  login: async ({ username, password }) => {
    const db = getLocalDb();
    if (username !== db.adminUser.username || password !== db.adminUser.password) {
      throw new Error('Usuario ou senha invalidos.');
    }
    window.localStorage.setItem(SESSION_KEY, LOCAL_TOKEN);
    return {
      token: LOCAL_TOKEN,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      user: {
        id: db.adminUser.id,
        username: db.adminUser.username,
        displayName: db.adminUser.displayName,
      },
    };
  },
  logout: async () => {
    window.localStorage.removeItem(SESSION_KEY);
    return { ok: true };
  },
  getAdminBootstrap: async () => {
    ensureAuthenticated();
    const db = getLocalDb();
    return {
      user: {
        userId: db.adminUser.id,
        username: db.adminUser.username,
        displayName: db.adminUser.displayName,
      },
      ...buildCalendarPayload(db),
    };
  },
  createParent: async (payload) => {
    ensureAuthenticated();
    const db = getLocalDb();
    const parent = { id: nextId(db.parents), name: payload.name, roleKey: payload.roleKey, colorKey: payload.colorKey || 'slate' };
    db.parents.push(parent);
    setLocalDb(db);
    return clone(parent);
  },
  updateParent: async (id, payload) => {
    ensureAuthenticated();
    const db = getLocalDb();
    const index = db.parents.findIndex((item) => item.id === Number(id));
    db.parents[index] = { ...db.parents[index], name: payload.name, roleKey: payload.roleKey, colorKey: payload.colorKey || 'slate' };
    setLocalDb(db);
    return clone(db.parents[index]);
  },
  deleteParent: async (id) => {
    ensureAuthenticated();
    const db = getLocalDb();
    db.parents = db.parents.filter((item) => item.id !== Number(id));
    setLocalDb(db);
    return { ok: true };
  },
  createRule: async (payload) => {
    ensureAuthenticated();
    const db = getLocalDb();
    const rule = normalizeRule(payload);
    rule.id = nextId(db.weeklyRules);
    rule.activities = [];
    db.weeklyRules.push(rule);
    setLocalDb(db);
    return clone(rule);
  },
  updateRule: async (id, payload) => {
    ensureAuthenticated();
    const db = getLocalDb();
    const index = db.weeklyRules.findIndex((item) => item.id === Number(id));
    db.weeklyRules[index] = normalizeRule(payload, db.weeklyRules[index]);
    db.weeklyRules[index].id = Number(id);
    setLocalDb(db);
    return clone(db.weeklyRules[index]);
  },
  deleteRule: async (id) => {
    ensureAuthenticated();
    const db = getLocalDb();
    db.weeklyRules = db.weeklyRules.filter((item) => item.id !== Number(id));
    setLocalDb(db);
    return { ok: true };
  },
  createActivity: async (payload) => {
    ensureAuthenticated();
    const db = getLocalDb();
    const activity = normalizeActivity(payload);
    activity.id = nextId(db.weeklyRules.flatMap((rule) => rule.activities));
    const rule = db.weeklyRules.find((item) => item.id === activity.weeklyRuleId);
    rule.activities.push(activity);
    setLocalDb(db);
    return clone(activity);
  },
  updateActivity: async (id, payload) => {
    ensureAuthenticated();
    const db = getLocalDb();
    const numericId = Number(id);
    const normalized = normalizeActivity(payload, { id: numericId });

    db.weeklyRules.forEach((rule) => {
      rule.activities = rule.activities.filter((activity) => activity.id !== numericId);
    });

    const rule = db.weeklyRules.find((item) => item.id === normalized.weeklyRuleId);
    rule.activities.push({ ...normalized, id: numericId });
    setLocalDb(db);
    return clone({ ...normalized, id: numericId });
  },
  deleteActivity: async (id) => {
    ensureAuthenticated();
    const db = getLocalDb();
    const numericId = Number(id);
    db.weeklyRules.forEach((rule) => {
      rule.activities = rule.activities.filter((activity) => activity.id !== numericId);
    });
    setLocalDb(db);
    return { ok: true };
  },
  updateWeekendConfig: async (payload) => {
    ensureAuthenticated();
    const db = getLocalDb();
    db.weekendConfig = {
      ...db.weekendConfig,
      occurrence: Number(payload.occurrence),
      startWeekday: Number(payload.startWeekday),
      durationDays: Number(payload.durationDays),
      parentId: Number(payload.parentId),
      label: String(payload.label || ''),
      pickupText: String(payload.pickupText || ''),
      highlightColor: String(payload.highlightColor || 'rose'),
    };
    setLocalDb(db);
    return clone(db.weekendConfig);
  },
  updateChildProfile: async (payload) => {
    ensureAuthenticated();
    const db = getLocalDb();
    db.childProfile = {
      ...db.childProfile,
      displayName: String(payload.displayName || '').trim(),
    };
    setLocalDb(db);
    return clone(db.childProfile);
  },
};

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
      cache: 'no-store',
      headers,
    });
  } catch (_error) {
    const fallbackError = new Error('API_UNAVAILABLE');
    fallbackError.code = 'API_UNAVAILABLE';
    throw fallbackError;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 413) {
      throw new Error('Os dados enviados sao grandes demais para salvar.');
    }
    if (response.status === 404 || response.status >= 500) {
      const fallbackError = new Error('API_UNAVAILABLE');
      fallbackError.code = 'API_UNAVAILABLE';
      throw fallbackError;
    }
    throw new Error(payload?.error || (response.status === 401 ? 'Usuario ou senha invalidos.' : 'Nao foi possivel concluir a solicitacao.'));
  }

  return payload || {};
};

const withFallback = async (remoteCall, localCall) => {
  try {
    return await remoteCall();
  } catch (error) {
    if (error?.code === 'API_UNAVAILABLE') {
      return localCall();
    }
    throw error;
  }
};

const withAdminPersistenceFallback = async (remoteCall, localCall, unavailableMessage) => {
  try {
    return await remoteCall();
  } catch (error) {
    if (error?.code === 'API_UNAVAILABLE') {
      if (getStoredToken() && getStoredToken() !== LOCAL_TOKEN) {
        throw new Error(unavailableMessage);
      }
      return localCall();
    }
    throw error;
  }
};

export const api = {
  getCalendar: () => withFallback(() => request('/api/calendar', { method: 'GET' }), () => localApi.getCalendar()),
  login: (payload) => withFallback(() => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }), () => localApi.login(payload)),
  logout: () => withFallback(() => request('/api/auth/logout', { method: 'POST' }), () => localApi.logout()),
  getAdminBootstrap: () => withFallback(() => request('/api/admin/bootstrap', { method: 'GET' }), () => localApi.getAdminBootstrap()),
  createParent: (payload) => withFallback(() => request('/api/admin/parents', { method: 'POST', body: JSON.stringify(payload) }), () => localApi.createParent(payload)),
  updateParent: (id, payload) => withFallback(() => request(`/api/admin/parents/${id}`, { method: 'PUT', body: JSON.stringify(payload) }), () => localApi.updateParent(id, payload)),
  deleteParent: (id) => withFallback(() => request(`/api/admin/parents/${id}`, { method: 'DELETE' }), () => localApi.deleteParent(id)),
  createRule: (payload) => withFallback(() => request('/api/admin/weekly-rules', { method: 'POST', body: JSON.stringify(payload) }), () => localApi.createRule(payload)),
  updateRule: (id, payload) => withFallback(() => request(`/api/admin/weekly-rules/${id}`, { method: 'PUT', body: JSON.stringify(payload) }), () => localApi.updateRule(id, payload)),
  deleteRule: (id) => withFallback(() => request(`/api/admin/weekly-rules/${id}`, { method: 'DELETE' }), () => localApi.deleteRule(id)),
  createActivity: (payload) => withFallback(() => request('/api/admin/activities', { method: 'POST', body: JSON.stringify(payload) }), () => localApi.createActivity(payload)),
  updateActivity: (id, payload) => withFallback(() => request(`/api/admin/activities/${id}`, { method: 'PUT', body: JSON.stringify(payload) }), () => localApi.updateActivity(id, payload)),
  deleteActivity: (id) => withFallback(() => request(`/api/admin/activities/${id}`, { method: 'DELETE' }), () => localApi.deleteActivity(id)),
  updateWeekendConfig: (payload) => withFallback(() => request('/api/admin/weekend-config', { method: 'PUT', body: JSON.stringify(payload) }), () => localApi.updateWeekendConfig(payload)),
  updateChildProfile: (payload) => withAdminPersistenceFallback(
    () => request('/api/admin/child-profile', { method: 'PUT', body: JSON.stringify(payload) }),
    () => localApi.updateChildProfile(payload),
    'Nao foi possivel salvar o perfil no servidor agora. Tente novamente em alguns instantes.',
  ),
};
