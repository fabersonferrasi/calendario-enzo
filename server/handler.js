import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { db, dbPath, verifyPassword } from './db.js';

const SESSION_TTL_HOURS = 12;
const distPath = path.resolve(process.cwd(), 'dist');
const uploadsDir = path.join(path.dirname(dbPath), 'uploads');
const AUTH_SECRET = process.env.AUTH_SECRET || 'agenda-enzo-local-auth-secret';

const parentSelect = `
  SELECT
    p.id,
    p.name,
    p.role_key AS roleKey,
    p.color_key AS colorKey
  FROM parents p
`;

const json = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const notFound = (res) => json(res, 404, { error: 'Rota nao encontrada.' });

const readJsonBody = async (req) => {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

const readRawBody = async (req, maxBytes = 6 * 1024 * 1024) => {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;

    if (totalBytes > maxBytes) {
      const error = new Error('PAYLOAD_TOO_LARGE');
      error.statusCode = 413;
      throw error;
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
};

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

  const activityMap = activities.reduce((acc, item) => {
    if (!acc[item.weeklyRuleId]) {
      acc[item.weeklyRuleId] = [];
    }
    acc[item.weeklyRuleId].push(item);
    return acc;
  }, {});

  return rules.map((rule) => ({ ...rule, activities: activityMap[rule.id] || [] }));
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

const getChildProfile = () => db.prepare(`
  SELECT
    cp.id,
    cp.display_name AS displayName,
    cp.photo_url AS photoUrl
  FROM child_profile cp
  WHERE cp.id = 1
`).get();

const getCalendarPayload = () => ({
  meta: {
    databasePath: dbPath,
    generatedAt: new Date().toISOString(),
  },
  parents: listParents(),
  weeklyRules: listWeeklyRules(),
  weekendConfig: getWeekendConfig(),
  childProfile: getChildProfile(),
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

const sanitizeChildProfile = (body) => ({
  display_name: String(body.displayName || '').trim(),
  photo_url: String(body.photoUrl || '').trim(),
});

const encodeBase64Url = (value) => Buffer.from(value).toString('base64url');

const decodeBase64Url = (value) => Buffer.from(value, 'base64url').toString('utf8');

const signToken = (payload) => crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');

const createSession = (user) => {
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000).toISOString();
  const payload = JSON.stringify({
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    expiresAt,
  });
  const encodedPayload = encodeBase64Url(payload);
  const signature = signToken(encodedPayload);
  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt,
  };
};

const getAuthorizedSession = (req) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signToken(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(decodeBase64Url(encodedPayload));
  } catch (_error) {
    return null;
  }

  if (!payload?.userId || !payload?.expiresAt || new Date(payload.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  const user = db.prepare(`
    SELECT id, username, display_name AS displayName
    FROM admin_users
    WHERE id = ?
  `).get(payload.userId);

  if (!user) {
    return null;
  }

  return {
    session: {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      expiresAt: payload.expiresAt,
    },
    token,
  };
};

const requireAuth = (req, res) => {
  const authorized = getAuthorizedSession(req);
  if (!authorized) {
    json(res, 401, { error: 'Nao autenticado.' });
    return null;
  }
  return authorized;
};

const serveUploadFile = (filename, res) => {
  const safeName = path.basename(filename);
  if (!safeName || safeName !== filename) {
    notFound(res);
    return;
  }

  const targetPath = path.join(uploadsDir, safeName);
  if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
    notFound(res);
    return;
  }

  const ext = path.extname(targetPath).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
  };

  res.statusCode = 200;
  res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  fs.createReadStream(targetPath).pipe(res);
};

const serveStatic = (req, res) => {
  const requestedPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(distPath, requestedPath === '/' ? 'index.html' : requestedPath);
  const safePath = path.normalize(filePath);

  if (!safePath.startsWith(distPath)) {
    notFound(res);
    return;
  }

  const targetPath = fs.existsSync(safePath) && fs.statSync(safePath).isFile() ? safePath : path.join(distPath, 'index.html');
  if (!fs.existsSync(targetPath)) {
    notFound(res);
    return;
  }

  const ext = path.extname(targetPath).toLowerCase();
  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
  };

  res.statusCode = 200;
  res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
  fs.createReadStream(targetPath).pipe(res);
};

const setCors = (req, res) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
};

export const handleRequest = async (req, res, options = {}) => {
  const { allowStatic = true } = options;

  try {
    setCors(req, res);

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const { pathname } = url;

    if (req.method === 'GET' && pathname === '/api/health') {
      json(res, 200, { ok: true, databasePath: dbPath });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/calendar') {
      json(res, 200, getCalendarPayload());
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/uploads/')) {
      serveUploadFile(pathname.slice('/api/uploads/'.length), res);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const body = await readJsonBody(req);
      const username = String(body.username || '').trim();
      const password = String(body.password || '');
      const user = db.prepare(`
        SELECT id, username, display_name AS displayName, password_salt AS passwordSalt, password_hash AS passwordHash
        FROM admin_users
        WHERE username = ?
      `).get(username);

      if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
        json(res, 401, { error: 'Usuario ou senha invalidos.' });
        return;
      }

      const created = createSession(user);
      json(res, 200, {
        token: created.token,
        expiresAt: created.expiresAt,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
        },
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/auth/logout') {
      const authorized = requireAuth(req, res);
      if (!authorized) return;
      json(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/admin/bootstrap') {
      const authorized = requireAuth(req, res);
      if (!authorized) return;
      json(res, 200, { user: authorized.session, ...getCalendarPayload() });
      return;
    }

    if (pathname.startsWith('/api/admin/')) {
      const authorized = requireAuth(req, res);
      if (!authorized) return;

      if ((req.method === 'POST' || req.method === 'PUT') && pathname !== '/api/admin/child-photo') {
        req.body = await readJsonBody(req);
      }

      if (req.method === 'POST' && pathname === '/api/admin/parents') {
        const payload = sanitizeParent(req.body);
        if (!payload.name || !payload.role_key) {
          json(res, 400, { error: 'Nome e identificador do responsavel sao obrigatorios.' });
          return;
        }
        const result = db.prepare('INSERT INTO parents (name, role_key, color_key) VALUES (@name, @role_key, @color_key)').run(payload);
        json(res, 201, db.prepare(`${parentSelect} WHERE p.id = ?`).get(result.lastInsertRowid));
        return;
      }

      if (req.method === 'PUT' && pathname.startsWith('/api/admin/parents/')) {
        const id = Number(pathname.split('/').pop());
        const payload = sanitizeParent(req.body);
        db.prepare('UPDATE parents SET name = @name, role_key = @role_key, color_key = @color_key WHERE id = @id').run({ ...payload, id });
        json(res, 200, db.prepare(`${parentSelect} WHERE p.id = ?`).get(id));
        return;
      }

      if (req.method === 'DELETE' && pathname.startsWith('/api/admin/parents/')) {
        db.prepare('DELETE FROM parents WHERE id = ?').run(Number(pathname.split('/').pop()));
        json(res, 200, { ok: true });
        return;
      }

      if (req.method === 'POST' && pathname === '/api/admin/weekly-rules') {
        const payload = sanitizeRule(req.body);
        const result = db.prepare(`
          INSERT INTO weekly_rules (
            weekday, custody_type, label, primary_parent_id, secondary_parent_id,
            school_parent_id, pickup_text, stripe_mode, highlight_color
          ) VALUES (
            @weekday, @custody_type, @label, @primary_parent_id, @secondary_parent_id,
            @school_parent_id, @pickup_text, @stripe_mode, @highlight_color
          )
        `).run(payload);
        json(res, 201, listWeeklyRules().find((item) => item.id === result.lastInsertRowid));
        return;
      }

      if (req.method === 'PUT' && pathname.startsWith('/api/admin/weekly-rules/')) {
        const id = Number(pathname.split('/').pop());
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
        `).run({ ...payload, id });
        json(res, 200, listWeeklyRules().find((item) => item.id === id));
        return;
      }

      if (req.method === 'DELETE' && pathname.startsWith('/api/admin/weekly-rules/')) {
        db.prepare('DELETE FROM weekly_rules WHERE id = ?').run(Number(pathname.split('/').pop()));
        json(res, 200, { ok: true });
        return;
      }

      if (req.method === 'POST' && pathname === '/api/admin/activities') {
        const payload = sanitizeActivity(req.body);
        const result = db.prepare('INSERT INTO activities (weekly_rule_id, time_label, title, icon_key, sort_order) VALUES (@weekly_rule_id, @time_label, @title, @icon_key, @sort_order)').run(payload);
        json(res, 201, db.prepare(`
          SELECT id, weekly_rule_id AS weeklyRuleId, time_label AS timeLabel, title, icon_key AS iconKey, sort_order AS sortOrder
          FROM activities WHERE id = ?
        `).get(result.lastInsertRowid));
        return;
      }

      if (req.method === 'PUT' && pathname.startsWith('/api/admin/activities/')) {
        const id = Number(pathname.split('/').pop());
        const payload = sanitizeActivity(req.body);
        db.prepare(`
          UPDATE activities
          SET weekly_rule_id = @weekly_rule_id, time_label = @time_label, title = @title, icon_key = @icon_key, sort_order = @sort_order
          WHERE id = @id
        `).run({ ...payload, id });
        json(res, 200, db.prepare(`
          SELECT id, weekly_rule_id AS weeklyRuleId, time_label AS timeLabel, title, icon_key AS iconKey, sort_order AS sortOrder
          FROM activities WHERE id = ?
        `).get(id));
        return;
      }

      if (req.method === 'DELETE' && pathname.startsWith('/api/admin/activities/')) {
        db.prepare('DELETE FROM activities WHERE id = ?').run(Number(pathname.split('/').pop()));
        json(res, 200, { ok: true });
        return;
      }

      if (req.method === 'PUT' && pathname === '/api/admin/weekend-config') {
        const payload = sanitizeWeekendConfig(req.body);
        db.prepare(`
          UPDATE weekend_config
          SET occurrence = @occurrence, start_weekday = @start_weekday, duration_days = @duration_days,
              parent_id = @parent_id, label = @label, pickup_text = @pickup_text, highlight_color = @highlight_color
          WHERE id = 1
        `).run(payload);
        json(res, 200, getWeekendConfig());
        return;
      }

      if (req.method === 'PUT' && pathname === '/api/admin/child-profile') {
        const payload = sanitizeChildProfile(req.body);
        if (!payload.display_name) {
          json(res, 400, { error: 'Nome de exibicao do jovem e obrigatorio.' });
          return;
        }
        db.prepare(`
          UPDATE child_profile
          SET display_name = @display_name, photo_url = @photo_url
          WHERE id = 1
        `).run(payload);
        json(res, 200, getChildProfile());
        return;
      }

      if (req.method === 'POST' && pathname === '/api/admin/child-photo') {
        const contentType = String(req.headers['content-type'] || '').toLowerCase();
        if (!contentType.startsWith('image/')) {
          json(res, 400, { error: 'Envie um arquivo de imagem valido.' });
          return;
        }

        let fileBuffer;
        try {
          fileBuffer = await readRawBody(req);
        } catch (error) {
          if (error?.statusCode === 413) {
            json(res, 413, { error: 'A foto enviada e grande demais.' });
            return;
          }
          throw error;
        }

        if (!fileBuffer.length) {
          json(res, 400, { error: 'A imagem enviada esta vazia.' });
          return;
        }

        const extensionMap = {
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/png': 'png',
          'image/webp': 'webp',
          'image/heic': 'heic',
        };
        const extension = extensionMap[contentType] || 'jpg';
        const filename = `child-profile.${extension}`;
        const photoUrl = `/api/uploads/${filename}?v=${Date.now()}`;

        fs.mkdirSync(uploadsDir, { recursive: true });
        for (const entry of fs.readdirSync(uploadsDir)) {
          if (entry.startsWith('child-profile.')) {
            const entryPath = path.join(uploadsDir, entry);
            if (fs.statSync(entryPath).isFile()) {
              fs.unlinkSync(entryPath);
            }
          }
        }

        fs.writeFileSync(path.join(uploadsDir, filename), fileBuffer);
        db.prepare('UPDATE child_profile SET photo_url = ? WHERE id = 1').run(photoUrl);
        json(res, 200, getChildProfile());
        return;
      }

      notFound(res);
      return;
    }

    if (allowStatic) {
      serveStatic(req, res);
      return;
    }

    notFound(res);
  } catch (error) {
    if (error?.statusCode === 413) {
      json(res, 413, { error: 'A requisicao enviada e grande demais.' });
      return;
    }
    json(res, 500, { error: error.message || 'Erro interno no servidor.' });
  }
};
