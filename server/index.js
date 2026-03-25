import path from 'node:path';
import crypto from 'node:crypto';
import express from 'express';
import { db, dbPath, hashToken, verifyPassword } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;
const SESSION_TTL_HOURS = 12;

app.use(express.json());

const parentSelect = `
  SELECT
    p.id,
    p.name,
    p.role_key AS roleKey,
    p.color_key AS colorKey
  FROM parents p
`;

const listParents = () => db.prepare(`${parentSelect} ORDER BY p.id`).all();

const listWeeklyRules = () => {
  const rules = db.prepare(`
    SELECT
      wr.id,
      wr.weekday,
      wr.custody_type AS custodyType,
      wr.label,
      wr.primary_parent_id AS primaryParentId,
      wr.secondary_parent_id AS secondaryParentId,
      wr.school_parent_id AS schoolParentId,
      wr.pickup_text AS pickupText,
      wr.stripe_mode AS stripeMode,
      wr.highlight_color AS highlightColor
    FROM weekly_rules wr
    ORDER BY wr.weekday
  `).all();

  const activityRows = db.prepare(`
    SELECT
      id,
      weekly_rule_id AS weeklyRuleId,
      time_label AS timeLabel,
      title,
      icon_key AS iconKey,
      sort_order AS sortOrder
    FROM activities
    ORDER BY weekly_rule_id, sort_order, id
  `).all();

  const activityMap = activityRows.reduce((acc, activity) => {
    if (!acc[activity.weeklyRuleId]) {
      acc[activity.weeklyRuleId] = [];
    }
    acc[activity.weeklyRuleId].push(activity);
    return acc;
  }, {});

  return rules.map((rule) => ({
    ...rule,
    activities: activityMap[rule.id] || [],
  }));
};

const getWeekendConfig = () => db.prepare(`
  SELECT
    wc.id,
    wc.occurrence,
    wc.start_weekday AS startWeekday,
    wc.duration_days AS durationDays,
    wc.parent_id AS parentId,
    wc.label,
    wc.pickup_text AS pickupText,
    wc.highlight_color AS highlightColor
  FROM weekend_config wc
  WHERE wc.id = 1
`).get();

const getCalendarPayload = () => ({
  meta: {
    databasePath: dbPath,
    generatedAt: new Date().toISOString(),
  },
  parents: listParents(),
  weeklyRules: listWeeklyRules(),
  weekendConfig: getWeekendConfig(),
});

const sanitizeParent = (body) => ({
  name: String(body.name || '').trim(),
  role_key: String(body.roleKey || '').trim().toLowerCase(),
  color_key: String(body.colorKey || 'slate').trim().toLowerCase(),
});

const sanitizeRule = (body) => ({
  weekday: Number(body.weekday),
  custody_type: String(body.custodyType || '').trim(),
  label: String(body.label || '').trim(),
  primary_parent_id: body.primaryParentId ? Number(body.primaryParentId) : null,
  secondary_parent_id: body.secondaryParentId ? Number(body.secondaryParentId) : null,
  school_parent_id: body.schoolParentId ? Number(body.schoolParentId) : null,
  pickup_text: String(body.pickupText || '').trim(),
  stripe_mode: String(body.stripeMode || 'solid').trim(),
  highlight_color: String(body.highlightColor || 'slate').trim(),
});

const sanitizeActivity = (body) => ({
  weekly_rule_id: Number(body.weeklyRuleId),
  time_label: String(body.timeLabel || '').trim(),
  title: String(body.title || '').trim(),
  icon_key: String(body.iconKey || 'heart').trim(),
  sort_order: Number(body.sortOrder || 0),
});

const sanitizeWeekendConfig = (body) => ({
  occurrence: Number(body.occurrence),
  start_weekday: Number(body.startWeekday),
  duration_days: Number(body.durationDays),
  parent_id: Number(body.parentId),
  label: String(body.label || '').trim(),
  pickup_text: String(body.pickupText || '').trim(),
  highlight_color: String(body.highlightColor || 'rose').trim(),
});

const createSession = (userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES (?, ?, ?)
  `).run(userId, tokenHash, expiresAt);

  return { token, expiresAt };
};

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ error: 'Nao autenticado.' });
  }

  const session = db.prepare(`
    SELECT
      s.id,
      s.user_id AS userId,
      s.expires_at AS expiresAt,
      a.username,
      a.display_name AS displayName
    FROM sessions s
    JOIN admin_users a ON a.id = s.user_id
    WHERE s.token_hash = ?
  `).get(hashToken(token));

  if (!session) {
    return res.status(401).json({ error: 'Sessao invalida.' });
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(session.id);
    return res.status(401).json({ error: 'Sessao expirada.' });
  }

  req.session = session;
  req.token = token;
  next();
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, databasePath: dbPath });
});

app.get('/api/calendar', (_req, res) => {
  res.json(getCalendarPayload());
});

app.post('/api/auth/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  const user = db.prepare(`
    SELECT id, username, display_name AS displayName, password_salt AS passwordSalt, password_hash AS passwordHash
    FROM admin_users
    WHERE username = ?
  `).get(username);

  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    return res.status(401).json({ error: 'Usuario ou senha invalidos.' });
  }

  const session = createSession(user.id);
  res.json({
    token: session.token,
    expiresAt: session.expiresAt,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    },
  });
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(req.token));
  res.json({ ok: true });
});

app.get('/api/admin/bootstrap', authMiddleware, (_req, res) => {
  res.json({
    user: _req.session,
    ...getCalendarPayload(),
  });
});

app.get('/api/admin/parents', authMiddleware, (_req, res) => {
  res.json(listParents());
});

app.post('/api/admin/parents', authMiddleware, (req, res) => {
  const payload = sanitizeParent(req.body);
  if (!payload.name || !payload.role_key) {
    return res.status(400).json({ error: 'Nome e identificador do responsavel sao obrigatorios.' });
  }

  const result = db.prepare(`
    INSERT INTO parents (name, role_key, color_key)
    VALUES (@name, @role_key, @color_key)
  `).run(payload);

  const parent = db.prepare(`${parentSelect} WHERE p.id = ?`).get(result.lastInsertRowid);
  res.status(201).json(parent);
});

app.put('/api/admin/parents/:id', authMiddleware, (req, res) => {
  const payload = sanitizeParent(req.body);
  db.prepare(`
    UPDATE parents
    SET name = @name, role_key = @role_key, color_key = @color_key
    WHERE id = @id
  `).run({ ...payload, id: Number(req.params.id) });

  const parent = db.prepare(`${parentSelect} WHERE p.id = ?`).get(Number(req.params.id));
  res.json(parent);
});

app.delete('/api/admin/parents/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM parents WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

app.get('/api/admin/weekly-rules', authMiddleware, (_req, res) => {
  res.json(listWeeklyRules());
});

app.post('/api/admin/weekly-rules', authMiddleware, (req, res) => {
  const payload = sanitizeRule(req.body);
  if (!payload.label || Number.isNaN(payload.weekday)) {
    return res.status(400).json({ error: 'Dia da semana e rotulo sao obrigatorios.' });
  }

  const result = db.prepare(`
    INSERT INTO weekly_rules (
      weekday, custody_type, label, primary_parent_id, secondary_parent_id,
      school_parent_id, pickup_text, stripe_mode, highlight_color
    ) VALUES (
      @weekday, @custody_type, @label, @primary_parent_id, @secondary_parent_id,
      @school_parent_id, @pickup_text, @stripe_mode, @highlight_color
    )
  `).run(payload);

  const rule = listWeeklyRules().find((item) => item.id === result.lastInsertRowid);
  res.status(201).json(rule);
});

app.put('/api/admin/weekly-rules/:id', authMiddleware, (req, res) => {
  const payload = sanitizeRule(req.body);
  db.prepare(`
    UPDATE weekly_rules
    SET
      weekday = @weekday,
      custody_type = @custody_type,
      label = @label,
      primary_parent_id = @primary_parent_id,
      secondary_parent_id = @secondary_parent_id,
      school_parent_id = @school_parent_id,
      pickup_text = @pickup_text,
      stripe_mode = @stripe_mode,
      highlight_color = @highlight_color
    WHERE id = @id
  `).run({ ...payload, id: Number(req.params.id) });

  const rule = listWeeklyRules().find((item) => item.id === Number(req.params.id));
  res.json(rule);
});

app.delete('/api/admin/weekly-rules/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM weekly_rules WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

app.get('/api/admin/activities', authMiddleware, (_req, res) => {
  const activities = db.prepare(`
    SELECT
      id,
      weekly_rule_id AS weeklyRuleId,
      time_label AS timeLabel,
      title,
      icon_key AS iconKey,
      sort_order AS sortOrder
    FROM activities
    ORDER BY weekly_rule_id, sort_order, id
  `).all();

  res.json(activities);
});

app.post('/api/admin/activities', authMiddleware, (req, res) => {
  const payload = sanitizeActivity(req.body);
  if (Number.isNaN(payload.weekly_rule_id) || !payload.time_label || !payload.title) {
    return res.status(400).json({ error: 'Regra, horario e titulo sao obrigatorios.' });
  }

  const result = db.prepare(`
    INSERT INTO activities (weekly_rule_id, time_label, title, icon_key, sort_order)
    VALUES (@weekly_rule_id, @time_label, @title, @icon_key, @sort_order)
  `).run(payload);

  const activity = db.prepare(`
    SELECT
      id,
      weekly_rule_id AS weeklyRuleId,
      time_label AS timeLabel,
      title,
      icon_key AS iconKey,
      sort_order AS sortOrder
    FROM activities
    WHERE id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(activity);
});

app.put('/api/admin/activities/:id', authMiddleware, (req, res) => {
  const payload = sanitizeActivity(req.body);
  db.prepare(`
    UPDATE activities
    SET
      weekly_rule_id = @weekly_rule_id,
      time_label = @time_label,
      title = @title,
      icon_key = @icon_key,
      sort_order = @sort_order
    WHERE id = @id
  `).run({ ...payload, id: Number(req.params.id) });

  const activity = db.prepare(`
    SELECT
      id,
      weekly_rule_id AS weeklyRuleId,
      time_label AS timeLabel,
      title,
      icon_key AS iconKey,
      sort_order AS sortOrder
    FROM activities
    WHERE id = ?
  `).get(Number(req.params.id));

  res.json(activity);
});

app.delete('/api/admin/activities/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM activities WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

app.get('/api/admin/weekend-config', authMiddleware, (_req, res) => {
  res.json(getWeekendConfig());
});

app.put('/api/admin/weekend-config', authMiddleware, (req, res) => {
  const payload = sanitizeWeekendConfig(req.body);
  db.prepare(`
    UPDATE weekend_config
    SET
      occurrence = @occurrence,
      start_weekday = @start_weekday,
      duration_days = @duration_days,
      parent_id = @parent_id,
      label = @label,
      pickup_text = @pickup_text,
      highlight_color = @highlight_color
    WHERE id = 1
  `).run(payload);

  res.json(getWeekendConfig());
});

const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Agenda Enzo backend running on http://localhost:${PORT}`);
  console.log(`SQLite database: ${dbPath}`);
});
