import { escapeLike, normalizeForSearch } from '@/lib/arabic';

import { cashEffectSql, contactEffectSql, KINDS, type AccountType, type Kind } from './kinds';
import type {
  Account,
  AccountWithBalance,
  Category,
  Contact,
  ContactWithBalance,
  Db,
  SqlParam,
  Transaction,
  TransactionInput,
  TransactionView,
} from './types';

const now = () => new Date().toISOString();

// ───────────────────────────── Contacts ─────────────────────────────

export type ContactFilter = 'all' | 'owes_me' | 'i_owe' | 'settled';

export async function listContacts(
  db: Db,
  opts: { search?: string; filter?: ContactFilter } = {},
): Promise<ContactWithBalance[]> {
  const where: string[] = [];
  const params: SqlParam[] = [];
  const q = opts.search ? normalizeForSearch(opts.search) : '';
  if (q) {
    where.push(`(c.name_search LIKE ? ESCAPE '\\' OR c.phone LIKE ? ESCAPE '\\')`);
    params.push(`%${escapeLike(q)}%`, `%${escapeLike(q)}%`);
  }
  const having: Record<ContactFilter, string> = {
    all: '',
    owes_me: 'HAVING balance > 0',
    i_owe: 'HAVING balance < 0',
    settled: 'HAVING balance = 0',
  };
  return db.getAllAsync<ContactWithBalance>(
    `SELECT c.id, c.name, c.phone, c.notes, c.created_at,
            COALESCE(SUM(${contactEffectSql('t')}), 0) AS balance,
            COUNT(t.id) AS tx_count,
            MAX(t.date) AS last_date
       FROM contacts c
       LEFT JOIN transactions t ON t.contact_id = c.id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      GROUP BY c.id
      ${having[opts.filter ?? 'all']}
      ORDER BY ABS(balance) DESC, c.name`,
    params,
  );
}

export async function getContact(db: Db, id: number): Promise<ContactWithBalance | null> {
  return db.getFirstAsync<ContactWithBalance>(
    `SELECT c.id, c.name, c.phone, c.notes, c.created_at,
            COALESCE(SUM(${contactEffectSql('t')}), 0) AS balance,
            COUNT(t.id) AS tx_count,
            MAX(t.date) AS last_date
       FROM contacts c
       LEFT JOIN transactions t ON t.contact_id = c.id
      WHERE c.id = ?
      GROUP BY c.id`,
    [id],
  );
}

export async function findContactByName(db: Db, name: string): Promise<Contact | null> {
  return db.getFirstAsync<Contact>(
    'SELECT id, name, phone, notes, created_at FROM contacts WHERE name_search = ?',
    [normalizeForSearch(name)],
  );
}

export interface ContactInput {
  name: string;
  phone: string | null;
  notes: string | null;
}

function cleanContact(input: ContactInput): ContactInput {
  const name = input.name.trim().replace(/\s+/g, ' ');
  if (!name) throw new UserError('اكتب الاسم');
  return { name, phone: input.phone?.trim() || null, notes: input.notes?.trim() || null };
}

export async function createContact(db: Db, input: ContactInput): Promise<number> {
  const c = cleanContact(input);
  const existing = await findContactByName(db, c.name);
  if (existing) throw new UserError(`فيه شخص متسجل بنفس الاسم: ${existing.name}`);
  const r = await db.runAsync(
    'INSERT INTO contacts (name, name_search, phone, notes, created_at) VALUES (?, ?, ?, ?, ?)',
    [c.name, normalizeForSearch(c.name), c.phone, c.notes, now()],
  );
  return r.lastInsertRowId;
}

export async function updateContact(db: Db, id: number, input: ContactInput): Promise<void> {
  const c = cleanContact(input);
  const existing = await findContactByName(db, c.name);
  if (existing && existing.id !== id) throw new UserError(`فيه شخص متسجل بنفس الاسم: ${existing.name}`);
  await db.runAsync('UPDATE contacts SET name = ?, name_search = ?, phone = ?, notes = ? WHERE id = ?', [
    c.name,
    normalizeForSearch(c.name),
    c.phone,
    c.notes,
    id,
  ]);
}

export async function deleteContact(db: Db, id: number): Promise<void> {
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM transactions WHERE contact_id = ?', [id]);
  if (row && row.n > 0) {
    throw new UserError(`مينفعش تمسح الشخص ده لأن عليه ${row.n} حركة. امسح الحركات الأول.`);
  }
  await db.runAsync('DELETE FROM contacts WHERE id = ?', [id]);
}

// ───────────────────────────── Accounts ─────────────────────────────

const accountBalanceSql = `
  a.opening_balance
  + COALESCE((SELECT SUM(${cashEffectSql('t')}) FROM transactions t WHERE t.account_id = a.id), 0)
  + COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.to_account_id = a.id AND t.kind = 'transfer'), 0)`;

export async function listAccounts(db: Db, opts: { includeArchived?: boolean } = {}): Promise<AccountWithBalance[]> {
  return db.getAllAsync<AccountWithBalance>(
    `SELECT a.*, (${accountBalanceSql}) AS balance
       FROM accounts a
      ${opts.includeArchived ? '' : 'WHERE a.archived = 0'}
      ORDER BY a.archived, a.id`,
    [],
  );
}

export async function getAccount(db: Db, id: number): Promise<AccountWithBalance | null> {
  return db.getFirstAsync<AccountWithBalance>(
    `SELECT a.*, (${accountBalanceSql}) AS balance FROM accounts a WHERE a.id = ?`,
    [id],
  );
}

export interface AccountInput {
  name: string;
  type: AccountType;
  opening_balance: number;
}

export async function createAccount(db: Db, input: AccountInput): Promise<number> {
  const name = input.name.trim();
  if (!name) throw new UserError('اكتب اسم الحساب');
  const r = await db.runAsync(
    'INSERT INTO accounts (name, type, opening_balance, created_at) VALUES (?, ?, ?, ?)',
    [name, input.type, input.opening_balance, now()],
  );
  return r.lastInsertRowId;
}

export async function updateAccount(db: Db, id: number, input: AccountInput & { archived?: boolean }): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new UserError('اكتب اسم الحساب');
  await db.runAsync('UPDATE accounts SET name = ?, type = ?, opening_balance = ?, archived = ? WHERE id = ?', [
    name,
    input.type,
    input.opening_balance,
    input.archived ? 1 : 0,
    id,
  ]);
}

export async function deleteAccount(db: Db, id: number): Promise<void> {
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM transactions WHERE account_id = ? OR to_account_id = ?',
    [id, id],
  );
  if (row && row.n > 0) {
    throw new UserError(`الحساب ده عليه ${row.n} حركة. تقدر تأرشفه بدل ما تمسحه.`);
  }
  await db.runAsync('DELETE FROM accounts WHERE id = ?', [id]);
}

// ──────────────────────────── Categories ────────────────────────────

export async function listCategories(db: Db, kind?: Kind, includeArchived = false): Promise<Category[]> {
  const where: string[] = [];
  const params: SqlParam[] = [];
  if (kind) {
    where.push('kind = ?');
    params.push(kind);
  }
  if (!includeArchived) where.push('archived = 0');
  return db.getAllAsync<Category>(
    `SELECT * FROM categories ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id`,
    params,
  );
}

export async function createCategory(db: Db, kind: Kind, name: string): Promise<number> {
  const n = name.trim();
  if (!n) throw new UserError('اكتب اسم التصنيف');
  if (!KINDS[kind].hasCategories) throw new UserError('النوع ده مالوش تصنيفات');
  const existing = await db.getFirstAsync<Category>('SELECT * FROM categories WHERE kind = ? AND name = ?', [kind, n]);
  if (existing) {
    if (existing.archived) await db.runAsync('UPDATE categories SET archived = 0 WHERE id = ?', [existing.id]);
    return existing.id;
  }
  const r = await db.runAsync('INSERT INTO categories (kind, name) VALUES (?, ?)', [kind, n]);
  return r.lastInsertRowId;
}

export async function renameCategory(db: Db, id: number, name: string): Promise<void> {
  const n = name.trim();
  if (!n) throw new UserError('اكتب اسم التصنيف');
  await db.runAsync('UPDATE categories SET name = ? WHERE id = ?', [n, id]);
}

export async function setCategoryArchived(db: Db, id: number, archived: boolean): Promise<void> {
  await db.runAsync('UPDATE categories SET archived = ? WHERE id = ?', [archived ? 1 : 0, id]);
}

// ─────────────────────────── Transactions ───────────────────────────

/** Errors safe to show to the user as-is. */
export class UserError extends Error {}

export async function validateTransaction(db: Db, input: TransactionInput): Promise<TransactionInput> {
  const def = KINDS[input.kind];
  if (!def) throw new UserError('نوع الحركة مش معروف');
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) throw new UserError('اكتب مبلغ صحيح أكبر من صفر');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new UserError('التاريخ مش صحيح');

  const out: TransactionInput = { ...input, note: input.note?.trim() || null };

  if (def.needsAccount) {
    if (!out.account_id) throw new UserError(input.kind === 'transfer' ? 'اختار الحساب اللي هتحول منه' : 'اختار الحساب (بنك / محفظة / كاش)');
  } else {
    out.account_id = null;
  }

  if (input.kind === 'transfer') {
    if (!out.to_account_id) throw new UserError('اختار الحساب اللي هتحول له');
    if (out.to_account_id === out.account_id) throw new UserError('مينفعش تحول لنفس الحساب');
  } else {
    out.to_account_id = null;
  }

  if (def.contactMode === 'required' && !out.contact_id) throw new UserError('اختار الشخص');
  if (def.contactMode === 'none') out.contact_id = null;

  if (!def.hasCategories) {
    out.category_id = null;
  } else if (out.category_id) {
    const cat = await db.getFirstAsync<Category>('SELECT * FROM categories WHERE id = ?', [out.category_id]);
    if (!cat || cat.kind !== input.kind) out.category_id = null;
  }

  for (const id of [out.account_id, out.to_account_id]) {
    if (id && !(await db.getFirstAsync('SELECT id FROM accounts WHERE id = ?', [id]))) {
      throw new UserError('الحساب ده مش موجود');
    }
  }
  if (out.contact_id && !(await db.getFirstAsync('SELECT id FROM contacts WHERE id = ?', [out.contact_id]))) {
    throw new UserError('الشخص ده مش موجود');
  }
  return out;
}

export async function createTransaction(db: Db, input: TransactionInput): Promise<number> {
  const t = await validateTransaction(db, input);
  const ts = now();
  const r = await db.runAsync(
    `INSERT INTO transactions (kind, date, amount, account_id, to_account_id, contact_id, category_id, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [t.kind, t.date, t.amount, t.account_id, t.to_account_id, t.contact_id, t.category_id, t.note, ts, ts],
  );
  return r.lastInsertRowId;
}

export async function updateTransaction(db: Db, id: number, input: TransactionInput): Promise<void> {
  const t = await validateTransaction(db, input);
  await db.runAsync(
    `UPDATE transactions
        SET kind = ?, date = ?, amount = ?, account_id = ?, to_account_id = ?, contact_id = ?, category_id = ?, note = ?, updated_at = ?
      WHERE id = ?`,
    [t.kind, t.date, t.amount, t.account_id, t.to_account_id, t.contact_id, t.category_id, t.note, now(), id],
  );
}

export async function deleteTransaction(db: Db, id: number): Promise<void> {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

const txSelect = `
  SELECT t.*,
         a.name AS account_name,
         ta.name AS to_account_name,
         c.name AS contact_name,
         cat.name AS category_name
    FROM transactions t
    LEFT JOIN accounts a ON a.id = t.account_id
    LEFT JOIN accounts ta ON ta.id = t.to_account_id
    LEFT JOIN contacts c ON c.id = t.contact_id
    LEFT JOIN categories cat ON cat.id = t.category_id`;

export interface TransactionFilter {
  kinds?: Kind[];
  contactId?: number;
  accountId?: number;
  categoryId?: number;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  order?: 'asc' | 'desc';
}

export async function listTransactions(db: Db, f: TransactionFilter = {}): Promise<TransactionView[]> {
  const where: string[] = [];
  const params: SqlParam[] = [];
  if (f.kinds?.length) {
    where.push(`t.kind IN (${f.kinds.map(() => '?').join(',')})`);
    params.push(...f.kinds);
  }
  if (f.contactId) {
    where.push('t.contact_id = ?');
    params.push(f.contactId);
  }
  if (f.accountId) {
    where.push('(t.account_id = ? OR t.to_account_id = ?)');
    params.push(f.accountId, f.accountId);
  }
  if (f.categoryId) {
    where.push('t.category_id = ?');
    params.push(f.categoryId);
  }
  if (f.from) {
    where.push('t.date >= ?');
    params.push(f.from);
  }
  if (f.to) {
    where.push('t.date <= ?');
    params.push(f.to);
  }
  const q = f.search ? normalizeForSearch(f.search) : '';
  if (q) {
    const like = `%${escapeLike(q)}%`;
    where.push(`(c.name_search LIKE ? ESCAPE '\\' OR t.note LIKE ? ESCAPE '\\' OR cat.name LIKE ? ESCAPE '\\')`);
    params.push(like, `%${escapeLike(f.search!.trim())}%`, `%${escapeLike(f.search!.trim())}%`);
  }
  const dir = f.order === 'asc' ? 'ASC' : 'DESC';
  let sql = `${txSelect} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY t.date ${dir}, t.id ${dir}`;
  if (f.limit) {
    sql += ' LIMIT ?';
    params.push(f.limit);
  }
  return db.getAllAsync<TransactionView>(sql, params);
}

export async function getTransaction(db: Db, id: number): Promise<TransactionView | null> {
  return db.getFirstAsync<TransactionView>(`${txSelect} WHERE t.id = ?`, [id]);
}

/** Signed effect of a transaction on a given contact's balance. */
export function contactEffect(t: Pick<Transaction, 'kind' | 'amount'>): number {
  return KINDS[t.kind].contact * t.amount;
}

/** Signed effect of a transaction on a given account's balance. */
export function accountEffect(t: Pick<Transaction, 'kind' | 'amount' | 'account_id' | 'to_account_id'>, accountId: number): number {
  if (t.kind === 'transfer' && t.to_account_id === accountId) return t.amount;
  if (t.account_id === accountId) return KINDS[t.kind].cash * t.amount;
  return 0;
}

export interface StatementLine {
  tx: TransactionView;
  effect: number;
  running: number;
}

/** Contact statement (كشف حساب) oldest → newest with running balance. */
export async function contactStatement(db: Db, contactId: number): Promise<StatementLine[]> {
  const rows = await listTransactions(db, { contactId, order: 'asc' });
  let running = 0;
  return rows.map((tx) => {
    const effect = contactEffect(tx);
    running += effect;
    return { tx, effect, running };
  });
}

/** Account statement oldest → newest with running balance starting from the opening balance. */
export async function accountStatement(db: Db, accountId: number): Promise<{ opening: number; lines: StatementLine[] }> {
  const acc = await db.getFirstAsync<Account>('SELECT * FROM accounts WHERE id = ?', [accountId]);
  const opening = acc?.opening_balance ?? 0;
  const rows = await listTransactions(db, { accountId, order: 'asc' });
  let running = opening;
  const lines = rows.map((tx) => {
    const effect = accountEffect(tx, accountId);
    running += effect;
    return { tx, effect, running };
  });
  return { opening, lines };
}

// ──────────────────────────── Dashboard ─────────────────────────────

export interface Summary {
  owedToMe: number; // sum of positive contact balances (ليا)
  iOwe: number; // sum of |negative| contact balances (عليا)
  cashTotal: number; // sum of all non-archived account balances
  debtorsCount: number;
  creditorsCount: number;
}

/** Contact totals as of a date (inclusive); omit `asOf` for all-time. */
export async function contactTotals(db: Db, asOf?: string): Promise<Omit<Summary, 'cashTotal'>> {
  const row = await db.getFirstAsync<{ owed: number; owe: number; dn: number; cn: number }>(
    `SELECT COALESCE(SUM(CASE WHEN b > 0 THEN b ELSE 0 END), 0) AS owed,
            COALESCE(SUM(CASE WHEN b < 0 THEN -b ELSE 0 END), 0) AS owe,
            COALESCE(SUM(CASE WHEN b > 0 THEN 1 ELSE 0 END), 0) AS dn,
            COALESCE(SUM(CASE WHEN b < 0 THEN 1 ELSE 0 END), 0) AS cn
       FROM (SELECT SUM(${contactEffectSql('t')}) AS b
               FROM transactions t
              WHERE t.contact_id IS NOT NULL ${asOf ? 'AND t.date <= ?' : ''}
              GROUP BY t.contact_id)`,
    asOf ? [asOf] : [],
  );
  return {
    owedToMe: row?.owed ?? 0,
    iOwe: row?.owe ?? 0,
    debtorsCount: row?.dn ?? 0,
    creditorsCount: row?.cn ?? 0,
  };
}

export async function getSummary(db: Db): Promise<Summary> {
  const totals = await contactTotals(db);
  const accounts = await listAccounts(db);
  return { ...totals, cashTotal: accounts.reduce((s, a) => s + a.balance, 0) };
}

/** Account balances as of a date (inclusive). */
export async function accountBalancesAsOf(db: Db, asOf: string): Promise<AccountWithBalance[]> {
  return db.getAllAsync<AccountWithBalance>(
    `SELECT a.*,
            a.opening_balance
            + COALESCE((SELECT SUM(${cashEffectSql('t')}) FROM transactions t WHERE t.account_id = a.id AND t.date <= ?), 0)
            + COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.to_account_id = a.id AND t.kind = 'transfer' AND t.date <= ?), 0)
            AS balance
       FROM accounts a
      WHERE a.archived = 0
      ORDER BY a.id`,
    [asOf, asOf],
  );
}

/** Monthly income vs expenses for the last N months (for the dashboard chart). */
export async function monthlyTrend(db: Db, from: string): Promise<{ month: string; income: number; expenses: number }[]> {
  return db.getAllAsync(
    `SELECT substr(date, 1, 7) AS month,
            SUM(CASE WHEN kind = 'income' THEN amount ELSE 0 END) AS income,
            SUM(CASE WHEN kind IN ('expense_business', 'expense_personal', 'tax') THEN amount ELSE 0 END) AS expenses
       FROM transactions
      WHERE date >= ?
      GROUP BY month
      ORDER BY month`,
    [from],
  );
}

// ───────────────────────────── Backup ───────────────────────────────

export interface BackupData {
  app: 'daftari';
  version: 1;
  exportedAt: string;
  data: {
    contacts: (Contact & { name_search?: string })[];
    accounts: Account[];
    categories: Category[];
    transactions: Transaction[];
  };
}

export async function exportAll(db: Db): Promise<BackupData> {
  return {
    app: 'daftari',
    version: 1,
    exportedAt: now(),
    data: {
      contacts: await db.getAllAsync('SELECT id, name, phone, notes, created_at FROM contacts ORDER BY id', []),
      accounts: await db.getAllAsync('SELECT * FROM accounts ORDER BY id', []),
      categories: await db.getAllAsync('SELECT * FROM categories ORDER BY id', []),
      transactions: await db.getAllAsync('SELECT * FROM transactions ORDER BY id', []),
    },
  };
}

export function parseBackup(json: string): BackupData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new UserError('الملف ده مش نسخة احتياطية صحيحة (JSON بايظ)');
  }
  const b = parsed as BackupData;
  if (!b || b.app !== 'daftari' || b.version !== 1 || !b.data) {
    throw new UserError('الملف ده مش نسخة احتياطية من دفتري');
  }
  const { contacts, accounts, categories, transactions } = b.data;
  if (![contacts, accounts, categories, transactions].every(Array.isArray)) {
    throw new UserError('النسخة الاحتياطية ناقصة');
  }
  return b;
}

/** Replaces ALL data with the backup contents, atomically. */
export async function importAll(db: Db, backup: BackupData): Promise<void> {
  const { contacts, accounts, categories, transactions } = backup.data;
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync('DELETE FROM transactions; DELETE FROM contacts; DELETE FROM accounts; DELETE FROM categories;');
    for (const c of contacts) {
      await txn.runAsync('INSERT INTO contacts (id, name, name_search, phone, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)', [
        c.id,
        c.name,
        normalizeForSearch(c.name),
        c.phone ?? null,
        c.notes ?? null,
        c.created_at,
      ]);
    }
    for (const a of accounts) {
      await txn.runAsync('INSERT INTO accounts (id, name, type, opening_balance, archived, created_at) VALUES (?, ?, ?, ?, ?, ?)', [
        a.id,
        a.name,
        a.type,
        a.opening_balance,
        a.archived ?? 0,
        a.created_at,
      ]);
    }
    for (const c of categories) {
      await txn.runAsync('INSERT INTO categories (id, kind, name, archived) VALUES (?, ?, ?, ?)', [
        c.id,
        c.kind,
        c.name,
        c.archived ?? 0,
      ]);
    }
    for (const t of transactions) {
      if (!KINDS[t.kind]) throw new UserError(`حركة بنوع مش معروف في النسخة: ${t.kind}`);
      await txn.runAsync(
        `INSERT INTO transactions (id, kind, date, amount, account_id, to_account_id, contact_id, category_id, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id,
          t.kind,
          t.date,
          t.amount,
          t.account_id ?? null,
          t.to_account_id ?? null,
          t.contact_id ?? null,
          t.category_id ?? null,
          t.note ?? null,
          t.created_at,
          t.updated_at,
        ],
      );
    }
  });
}

// ───────────────────────────── Meta ─────────────────────────────────

export async function getMeta(db: Db, key: string): Promise<string | null> {
  const r = await db.getFirstAsync<{ value: string | null }>('SELECT value FROM meta WHERE key = ?', [key]);
  return r?.value ?? null;
}

export async function setMeta(db: Db, key: string, value: string | null): Promise<void> {
  await db.runAsync('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, value]);
}
