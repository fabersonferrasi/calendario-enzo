import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const dataDir = isServerless
  ? path.resolve('/tmp', 'agenda-enzo')
  : path.resolve(process.cwd(), 'server', 'data');
const dbPath = path.join(dataDir, 'agenda-enzo.sqlite');

fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL;');

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
};

const verifyPassword = (password, salt, expectedHash) => {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const runMigrations = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS parents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role_key TEXT NOT NULL UNIQUE,
      color_key TEXT NOT NULL DEFAULT 'slate'
    );

    CREATE TABLE IF NOT EXISTS weekly_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weekday INTEGER NOT NULL UNIQUE CHECK (weekday >= 0 AND weekday <= 6),
      custody_type TEXT NOT NULL CHECK (custody_type IN ('parent', 'exchange')),
      label TEXT NOT NULL,
      primary_parent_id INTEGER,
      secondary_parent_id INTEGER,
      school_parent_id INTEGER,
      pickup_text TEXT DEFAULT '',
      stripe_mode TEXT NOT NULL DEFAULT 'solid',
      highlight_color TEXT NOT NULL DEFAULT 'slate',
      FOREIGN KEY (primary_parent_id) REFERENCES parents(id),
      FOREIGN KEY (secondary_parent_id) REFERENCES parents(id),
      FOREIGN KEY (school_parent_id) REFERENCES parents(id)
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weekly_rule_id INTEGER NOT NULL,
      time_label TEXT NOT NULL,
      title TEXT NOT NULL,
      icon_key TEXT NOT NULL DEFAULT 'heart',
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (weekly_rule_id) REFERENCES weekly_rules(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS weekend_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      occurrence INTEGER NOT NULL DEFAULT 2,
      start_weekday INTEGER NOT NULL DEFAULT 5,
      duration_days INTEGER NOT NULL DEFAULT 3,
      parent_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      pickup_text TEXT DEFAULT '',
      highlight_color TEXT NOT NULL DEFAULT 'rose',
      FOREIGN KEY (parent_id) REFERENCES parents(id)
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS child_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      display_name TEXT NOT NULL,
      photo_url TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );
  `);
};

const seedParents = () => {
  const count = db.prepare('SELECT COUNT(*) AS count FROM parents').get().count;
  if (count > 0) {
    return;
  }

  const insertParent = db.prepare(`
    INSERT INTO parents (name, role_key, color_key)
    VALUES (@name, @role_key, @color_key)
  `);

  insertParent.run({ name: 'Faberson', role_key: 'pai', color_key: 'blue' });
  insertParent.run({ name: 'Juliana', role_key: 'mae', color_key: 'rose' });
};

const getParentIds = () => {
  const rows = db.prepare('SELECT id, role_key FROM parents').all();
  return rows.reduce((acc, row) => {
    acc[row.role_key] = row.id;
    return acc;
  }, {});
};

const seedWeeklyRules = () => {
  const count = db.prepare('SELECT COUNT(*) AS count FROM weekly_rules').get().count;
  if (count > 0) {
    return;
  }

  const parentIds = getParentIds();
  const insertRule = db.prepare(`
    INSERT INTO weekly_rules (
      weekday, custody_type, label, primary_parent_id, secondary_parent_id,
      school_parent_id, pickup_text, stripe_mode, highlight_color
    ) VALUES (
      @weekday, @custody_type, @label, @primary_parent_id, @secondary_parent_id,
      @school_parent_id, @pickup_text, @stripe_mode, @highlight_color
    )
  `);

  const insertActivity = db.prepare(`
    INSERT INTO activities (weekly_rule_id, time_label, title, icon_key, sort_order)
    VALUES (@weekly_rule_id, @time_label, @title, @icon_key, @sort_order)
  `);

  const rules = [
    {
      weekday: 1,
      custody_type: 'exchange',
      label: 'Troca (Pai -> Mae)',
      primary_parent_id: parentIds.pai,
      secondary_parent_id: parentIds.mae,
      school_parent_id: parentIds.pai,
      pickup_text: 'Juliana busca as 16:00h',
      stripe_mode: 'gradient-blue-rose',
      highlight_color: 'slate',
      activities: [
        { time_label: '07:30h', title: 'Escola (Pai leva)', icon_key: 'graduation', sort_order: 1 },
        { time_label: '16:00h', title: 'Saida (Mae busca)', icon_key: 'user', sort_order: 2 },
        { time_label: '19:00h', title: 'Jiu-Jitsu', icon_key: 'activity', sort_order: 3 },
      ],
    },
    {
      weekday: 2,
      custody_type: 'parent',
      label: 'Mae (Juliana)',
      primary_parent_id: parentIds.mae,
      secondary_parent_id: null,
      school_parent_id: parentIds.mae,
      pickup_text: '',
      stripe_mode: 'solid',
      highlight_color: 'rose',
      activities: [
        { time_label: '07:30h', title: 'Escola (Mae leva)', icon_key: 'graduation', sort_order: 1 },
        { time_label: '13:00h', title: 'Reforco Pedagogico', icon_key: 'book', sort_order: 2 },
      ],
    },
    {
      weekday: 3,
      custody_type: 'exchange',
      label: 'Troca (Mae -> Pai)',
      primary_parent_id: parentIds.mae,
      secondary_parent_id: parentIds.pai,
      school_parent_id: parentIds.mae,
      pickup_text: 'Faberson busca as 14:00h',
      stripe_mode: 'gradient-rose-blue',
      highlight_color: 'slate',
      activities: [
        { time_label: '07:30h', title: 'Escola (Mae leva)', icon_key: 'graduation', sort_order: 1 },
        { time_label: '13:00h', title: 'Reforco', icon_key: 'book', sort_order: 2 },
        { time_label: '14:00h', title: 'Saida (Pai busca)', icon_key: 'user', sort_order: 3 },
        { time_label: '19:00h', title: 'Jiu-Jitsu', icon_key: 'activity', sort_order: 4 },
      ],
    },
    {
      weekday: 4,
      custody_type: 'exchange',
      label: 'Troca (Pai -> Mae)',
      primary_parent_id: parentIds.pai,
      secondary_parent_id: parentIds.mae,
      school_parent_id: parentIds.pai,
      pickup_text: 'Juliana busca as 12:30h',
      stripe_mode: 'gradient-blue-rose',
      highlight_color: 'slate',
      activities: [
        { time_label: '07:30h', title: 'Escola (Pai leva)', icon_key: 'graduation', sort_order: 1 },
        { time_label: '12:30h', title: 'Saida (Mae busca)', icon_key: 'user', sort_order: 2 },
        { time_label: '16:00h', title: 'Psicologa', icon_key: 'heart', sort_order: 3 },
      ],
    },
    {
      weekday: 5,
      custody_type: 'exchange',
      label: 'Troca (Mae -> Pai)',
      primary_parent_id: parentIds.mae,
      secondary_parent_id: parentIds.pai,
      school_parent_id: parentIds.mae,
      pickup_text: 'Faberson busca as 12:30h',
      stripe_mode: 'gradient-rose-blue',
      highlight_color: 'slate',
      activities: [
        { time_label: '07:30h', title: 'Escola (Mae leva)', icon_key: 'graduation', sort_order: 1 },
        { time_label: '12:30h', title: 'Saida (Pai busca)', icon_key: 'user', sort_order: 2 },
        { time_label: '19:00h', title: 'Jiu-Jitsu', icon_key: 'activity', sort_order: 3 },
      ],
    },
    {
      weekday: 6,
      custody_type: 'parent',
      label: 'Pai (Faberson)',
      primary_parent_id: parentIds.pai,
      secondary_parent_id: null,
      school_parent_id: null,
      pickup_text: '',
      stripe_mode: 'solid',
      highlight_color: 'blue',
      activities: [
        { time_label: 'Dia todo', title: 'Tempo livre', icon_key: 'heart', sort_order: 1 },
      ],
    },
    {
      weekday: 0,
      custody_type: 'parent',
      label: 'Pai (Faberson)',
      primary_parent_id: parentIds.pai,
      secondary_parent_id: null,
      school_parent_id: null,
      pickup_text: '',
      stripe_mode: 'solid',
      highlight_color: 'blue',
      activities: [
        { time_label: 'Dia todo', title: 'Tempo livre', icon_key: 'heart', sort_order: 1 },
      ],
    },
  ];

  for (const rule of rules) {
    const { activities, ...payload } = rule;
    const result = insertRule.run(payload);
    for (const activity of activities) {
      insertActivity.run({ weekly_rule_id: result.lastInsertRowid, ...activity });
    }
  }
};

const seedWeekendConfig = () => {
  const count = db.prepare('SELECT COUNT(*) AS count FROM weekend_config').get().count;
  if (count > 0) {
    return;
  }

  const parentIds = getParentIds();
  db.prepare(`
    INSERT INTO weekend_config (
      id, occurrence, start_weekday, duration_days, parent_id, label, pickup_text, highlight_color
    ) VALUES (1, 2, 5, 3, ?, 'Mae (FDS especial)', 'Mae busca para o FDS', 'rose')
  `).run(parentIds.mae);
};

const seedAdmin = () => {
  const count = db.prepare('SELECT COUNT(*) AS count FROM admin_users').get().count;
  if (count > 0) {
    return;
  }

  const { salt, hash } = hashPassword('admin123');
  db.prepare(`
    INSERT INTO admin_users (username, display_name, password_salt, password_hash)
    VALUES (?, ?, ?, ?)
  `).run('admin', 'Administrador', salt, hash);
};

const seedChildProfile = () => {
  const count = db.prepare('SELECT COUNT(*) AS count FROM child_profile').get().count;
  if (count > 0) {
    return;
  }

  db.prepare(`
    INSERT INTO child_profile (id, display_name, photo_url)
    VALUES (1, ?, ?)
  `).run('Enzo', 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=400&q=80');
};

runMigrations();
seedParents();
seedWeeklyRules();
seedWeekendConfig();
seedAdmin();
seedChildProfile();

export { db, dbPath, hashPassword, verifyPassword, hashToken };
