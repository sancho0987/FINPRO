-- FINPRO — esquema inicial
-- Los montos se guardan en centavos (INTEGER) para evitar errores de punto flotante.

CREATE TABLE users (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT    NOT NULL,
  email            TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash    TEXT    NOT NULL,
  role             TEXT    NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active        INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  failed_attempts  INTEGER NOT NULL DEFAULT 0,
  locked_until     TEXT,
  last_login_at    TEXT,
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Sesiones del servidor: la cookie guarda un token aleatorio, aquí solo su hash SHA-256.
CREATE TABLE sessions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    TEXT    NOT NULL UNIQUE,
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_used_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at    TEXT    NOT NULL,
  user_agent    TEXT,
  ip            TEXT
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

CREATE TABLE password_resets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT    NOT NULL UNIQUE,
  expires_at  TEXT    NOT NULL,
  used_at     TEXT,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_resets_user ON password_resets(user_id);

-- Configuración del hogar (1 a 1 con el usuario)
CREATE TABLE settings (
  user_id           INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  household_name    TEXT    NOT NULL DEFAULT 'Mi Familia',
  currency          TEXT    NOT NULL DEFAULT 'COP' CHECK (currency IN ('COP','USD','EUR','MXN','ARS')),
  cutoff_day        INTEGER NOT NULL DEFAULT 1  CHECK (cutoff_day BETWEEN 1 AND 28),
  alert_pct         INTEGER NOT NULL DEFAULT 80 CHECK (alert_pct BETWEEN 50 AND 100),
  ant_limit_cents   INTEGER NOT NULL DEFAULT 3000000 CHECK (ant_limit_cents >= 0)
);

CREATE TABLE categories (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL COLLATE NOCASE,
  emoji         TEXT    NOT NULL DEFAULT '📦',
  color         TEXT    NOT NULL DEFAULT '#64748b',
  budget_cents  INTEGER NOT NULL DEFAULT 0 CHECK (budget_cents >= 0),
  is_ant        INTEGER NOT NULL DEFAULT 0 CHECK (is_ant IN (0, 1)),
  sort_order    INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, name)
);
CREATE INDEX idx_categories_user ON categories(user_id);

CREATE TABLE members (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name      TEXT    NOT NULL,
  role      TEXT    NOT NULL DEFAULT 'Adulto' CHECK (role IN ('Titular','Adulto','Joven','Niño','Otro')),
  emoji     TEXT    NOT NULL DEFAULT '👤',
  color     TEXT    NOT NULL DEFAULT '#4fd1a5'
);
CREATE INDEX idx_members_user ON members(user_id);

CREATE TABLE transactions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  category_id   INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  member_id     INTEGER          REFERENCES members(id)    ON DELETE SET NULL,
  type          TEXT    NOT NULL CHECK (type IN ('gasto', 'ingreso')),
  amount_cents  INTEGER NOT NULL CHECK (amount_cents > 0),
  description   TEXT    NOT NULL,
  note          TEXT    NOT NULL DEFAULT '',
  date          TEXT    NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_tx_user_date ON transactions(user_id, date);
CREATE INDEX idx_tx_user_cat  ON transactions(user_id, category_id);
CREATE INDEX idx_tx_user_mem  ON transactions(user_id, member_id);
