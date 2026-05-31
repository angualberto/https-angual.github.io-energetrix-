import initSqlJs, { type Database } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

export type UserRole = 'comprador' | 'vendedor';

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
}

interface AuthResult {
  ok: boolean;
  message: string;
  user?: AuthUser;
}

const DB_STORAGE_KEY = 'energetrix-auth-sqlite-db-v1';

let dbPromise: Promise<Database> | null = null;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function persistDb(db: Database) {
  const exported = db.export();
  localStorage.setItem(DB_STORAGE_KEY, bytesToBase64(exported));
}

function setupSchema(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('comprador', 'vendedor')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const countResult = db.exec('SELECT COUNT(*) AS total FROM users;');
  const totalUsers = Number(countResult?.[0]?.values?.[0]?.[0] ?? 0);

  if (totalUsers === 0) {
    db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?);", ['admin', 'admin', 'vendedor']);
    db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?);", ['comprador', 'comprador', 'comprador']);
    persistDb(db);
  }
}

async function getDb(): Promise<Database> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: () => wasmUrl
    });

    const stored = localStorage.getItem(DB_STORAGE_KEY);
    const db = stored ? new SQL.Database(base64ToBytes(stored)) : new SQL.Database();

    setupSchema(db);
    return db;
  })();

  return dbPromise;
}

export async function initializeAuthDb() {
  await getDb();
}

export async function loginUser(username: string, password: string): Promise<AuthResult> {
  const db = await getDb();
  const stmt = db.prepare(
    'SELECT id, username, role FROM users WHERE username = ? AND password = ? LIMIT 1;'
  );

  stmt.bind([username.trim(), password]);

  if (!stmt.step()) {
    stmt.free();
    return {
      ok: false,
      message: 'Usuário ou senha inválidos.'
    };
  }

  const row = stmt.getAsObject() as { id: number; username: string; role: UserRole };
  stmt.free();

  return {
    ok: true,
    message: 'Login realizado com sucesso.',
    user: {
      id: Number(row.id),
      username: String(row.username),
      role: row.role
    }
  };
}

export async function registerUser(username: string, password: string, role: UserRole): Promise<AuthResult> {
  const cleanUsername = username.trim();

  if (cleanUsername.length < 3) {
    return {
      ok: false,
      message: 'O usuário deve ter pelo menos 3 caracteres.'
    };
  }

  if (password.length < 4) {
    return {
      ok: false,
      message: 'A senha deve ter pelo menos 4 caracteres.'
    };
  }

  const db = await getDb();
  const existingStmt = db.prepare('SELECT id FROM users WHERE username = ? LIMIT 1;');
  existingStmt.bind([cleanUsername]);

  const userExists = existingStmt.step();
  existingStmt.free();

  if (userExists) {
    return {
      ok: false,
      message: 'Este usuário já existe. Escolha outro nome.'
    };
  }

  db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?);', [cleanUsername, password, role]);
  persistDb(db);

  const loginResult = await loginUser(cleanUsername, password);
  if (!loginResult.ok || !loginResult.user) {
    return {
      ok: false,
      message: 'Usuário criado, mas não foi possível iniciar a sessão automaticamente.'
    };
  }

  return {
    ok: true,
    message: 'Cadastro realizado com sucesso.',
    user: loginResult.user
  };
}
