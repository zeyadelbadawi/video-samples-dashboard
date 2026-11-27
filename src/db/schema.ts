import { DEFAULT_CATEGORIES, type Kind } from './kinds';
import type { Db } from './types';

/**
 * Ordered migrations. Never edit a shipped migration — append a new one.
 * The index+1 is stored in PRAGMA user_version.
 */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_search TEXT NOT NULL,
    phone TEXT,
    notes TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_contacts_name_search ON contacts(name_search);

  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'wallet')),
    opening_balance INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0,
    UNIQUE (kind, name)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    date TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    account_id INTEGER REFERENCES accounts(id),
    to_account_id INTEGER REFERENCES accounts(id),
    contact_id INTEGER REFERENCES contacts(id),
    category_id INTEGER REFERENCES categories(id),
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_tx_contact ON transactions(contact_id);
  CREATE INDEX IF NOT EXISTS idx_tx_account ON transactions(account_id);
  CREATE INDEX IF NOT EXISTS idx_tx_to_account ON transactions(to_account_id);
  CREATE INDEX IF NOT EXISTS idx_tx_kind ON transactions(kind);

  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  `,
];

export const SCHEMA_VERSION = MIGRATIONS.length;

export async function migrate(db: Db): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  let version = row?.user_version ?? 0;

  while (version < MIGRATIONS.length) {
    const sql = MIGRATIONS[version];
    const next = version + 1;
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(sql);
      if (version === 0) await seed(txn);
      await txn.execAsync(`PRAGMA user_version = ${next}`);
    });
    version = next;
  }
}

async function seed(db: Db): Promise<void> {
  const now = new Date().toISOString();
  for (const [kind, names] of Object.entries(DEFAULT_CATEGORIES) as [Kind, string[]][]) {
    for (const name of names) {
      await db.runAsync('INSERT OR IGNORE INTO categories (kind, name) VALUES (?, ?)', [kind, name]);
    }
  }
  await db.runAsync(
    'INSERT INTO accounts (name, type, opening_balance, created_at) VALUES (?, ?, 0, ?)',
    ['الكاش اللي معايا', 'cash', now],
  );
}
