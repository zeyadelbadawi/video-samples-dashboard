/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { normalizeForSearch } from '../src/lib/arabic';
import { getPeriod } from '../src/lib/dates';
import { formatAmount, parseAmount } from '../src/lib/money';
import { migrate } from '../src/db/schema';
import {
  accountStatement,
  contactStatement,
  createAccount,
  createContact,
  createTransaction,
  deleteAccount,
  deleteContact,
  exportAll,
  getContact,
  getSummary,
  importAll,
  listAccounts,
  listCategories,
  listContacts,
  listTransactions,
  parseBackup,
  updateTransaction,
  UserError,
} from '../src/db/queries';
import { buildReport } from '../src/db/reports';
import type { Db, TransactionInput } from '../src/db/types';
import { openTestDb } from './node-db';

const tx = (p: Partial<TransactionInput> & Pick<TransactionInput, 'kind' | 'amount'>): TransactionInput => ({
  date: '2026-11-10',
  account_id: null,
  to_account_id: null,
  contact_id: null,
  category_id: null,
  note: null,
  ...p,
});

async function setup() {
  const db = openTestDb();
  await migrate(db);
  const [cash] = await listAccounts(db);
  const bank = await createAccount(db, { name: 'بنك مصر', type: 'bank', opening_balance: 100_000_00 });
  const loanBank = await createAccount(db, { name: 'بنك عليه قرض', type: 'bank', opening_balance: -20_000_00 });
  const wallet = await createAccount(db, { name: 'فودافون كاش', type: 'wallet', opening_balance: 0 });
  const ahmed = await createContact(db, { name: 'أحمد محمود', phone: '0100', notes: null });
  const fatma = await createContact(db, { name: 'فاطمة علي', phone: null, notes: null });
  return { db, cash: cash.id, bank, loanBank, wallet, ahmed, fatma };
}

test('money parsing and formatting', () => {
  assert.equal(parseAmount('1,250.5'), 125050);
  assert.equal(parseAmount('١٢٥٠٫٥'), 125050);
  assert.equal(parseAmount('0.01'), 1);
  assert.equal(parseAmount('10.123'), null);
  assert.equal(parseAmount('abc'), null);
  assert.equal(parseAmount(''), null);
  assert.equal(formatAmount(123456), '1,234.56');
  assert.equal(formatAmount(100000), '1,000');
  assert.equal(formatAmount(-500), '-5');
});

test('arabic search normalization', () => {
  assert.equal(normalizeForSearch('أحمد'), normalizeForSearch('احمد'));
  assert.equal(normalizeForSearch('فاطمة'), normalizeForSearch('فاطمه'));
  assert.equal(normalizeForSearch('مصطفى'), normalizeForSearch('مصطفي'));
});

test('periods: Egyptian week is Saturday → Friday', () => {
  const ref = new Date(2026, 10, 27); // Friday 27 Nov 2026
  const w = getPeriod('week', 0, ref);
  assert.equal(w.from, '2026-11-21');
  assert.equal(w.to, '2026-11-27');
  assert.equal(getPeriod('week', -1, ref).from, '2026-11-14');
  const m = getPeriod('month', -1, ref);
  assert.equal(m.from, '2026-10-01');
  assert.equal(m.to, '2026-10-31');
  assert.equal(getPeriod('month', -10, ref).from, '2026-01-01');
  assert.equal(getPeriod('month', -11, ref).from, '2025-12-01');
});

test('migrations seed categories and a cash account, and are idempotent', async () => {
  const db = openTestDb();
  await migrate(db);
  await migrate(db);
  assert.equal((await listAccounts(db)).length, 1);
  assert.ok((await listCategories(db, 'tax')).length >= 5);
});

test('contact balances: ليا / عليا through debts, loans, collections and repayments', async () => {
  const { db, bank, cash, ahmed, fatma } = await setup();

  // Ahmed owes me 5,000 fees, I lent him 2,000 cash, he paid back 3,000 to the bank.
  await createTransaction(db, tx({ kind: 'receivable', amount: 5_000_00, contact_id: ahmed }));
  await createTransaction(db, tx({ kind: 'loan_given', amount: 2_000_00, contact_id: ahmed, account_id: cash }));
  await createTransaction(db, tx({ kind: 'collection', amount: 3_000_00, contact_id: ahmed, account_id: bank }));
  assert.equal((await getContact(db, ahmed))!.balance, 4_000_00);

  // I borrowed 10,000 from Fatma, repaid 4,000.
  await createTransaction(db, tx({ kind: 'loan_taken', amount: 10_000_00, contact_id: fatma, account_id: bank }));
  await createTransaction(db, tx({ kind: 'repayment', amount: 4_000_00, contact_id: fatma, account_id: bank }));
  assert.equal((await getContact(db, fatma))!.balance, -6_000_00);

  // Income tagged with a contact must not change their debt balance.
  await createTransaction(db, tx({ kind: 'income', amount: 1_000_00, contact_id: fatma, account_id: bank }));
  assert.equal((await getContact(db, fatma))!.balance, -6_000_00);

  const s = await getSummary(db);
  assert.equal(s.owedToMe, 4_000_00);
  assert.equal(s.iOwe, 6_000_00);

  assert.deepEqual((await listContacts(db, { filter: 'owes_me' })).map((c) => c.id), [ahmed]);
  assert.deepEqual((await listContacts(db, { filter: 'i_owe' })).map((c) => c.id), [fatma]);

  const st = await contactStatement(db, ahmed);
  assert.deepEqual(st.map((l) => l.running), [5_000_00, 7_000_00, 4_000_00]);
});

test('account balances: opening (incl. negative), cash effects and transfers', async () => {
  const { db, bank, loanBank, wallet, cash, ahmed } = await setup();
  await createTransaction(db, tx({ kind: 'income', amount: 15_000_00, account_id: bank }));
  await createTransaction(db, tx({ kind: 'expense_business', amount: 3_000_00, account_id: bank }));
  await createTransaction(db, tx({ kind: 'tax', amount: 1_000_00, account_id: bank }));
  await createTransaction(db, tx({ kind: 'transfer', amount: 2_500_00, account_id: bank, to_account_id: wallet }));
  await createTransaction(db, tx({ kind: 'expense_personal', amount: 500_00, account_id: wallet }));
  await createTransaction(db, tx({ kind: 'receivable', amount: 9_999_00, contact_id: ahmed })); // no cash

  const byId = Object.fromEntries((await listAccounts(db)).map((a) => [a.id, a.balance]));
  assert.equal(byId[bank], 100_000_00 + 15_000_00 - 3_000_00 - 1_000_00 - 2_500_00);
  assert.equal(byId[wallet], 2_500_00 - 500_00);
  assert.equal(byId[loanBank], -20_000_00);
  assert.equal(byId[cash], 0);

  const { lines } = await accountStatement(db, wallet);
  assert.deepEqual(lines.map((l) => l.effect), [2_500_00, -500_00]);
});

test('validation rejects inconsistent transactions', async () => {
  const { db, bank, ahmed } = await setup();
  await assert.rejects(createTransaction(db, tx({ kind: 'collection', amount: 100, account_id: bank })), UserError);
  await assert.rejects(createTransaction(db, tx({ kind: 'income', amount: 100 })), UserError);
  await assert.rejects(createTransaction(db, tx({ kind: 'income', amount: 0, account_id: bank })), UserError);
  await assert.rejects(
    createTransaction(db, tx({ kind: 'transfer', amount: 100, account_id: bank, to_account_id: bank })),
    UserError,
  );
  // receivable silently drops a stray account so it can never move cash
  const id = await createTransaction(db, tx({ kind: 'receivable', amount: 100, contact_id: ahmed, account_id: bank }));
  const [row] = await listTransactions(db, { contactId: ahmed });
  assert.equal(row.id, id);
  assert.equal(row.account_id, null);
});

test('editing a transaction re-derives balances; deleting guarded entities fails', async () => {
  const { db, bank, ahmed } = await setup();
  const id = await createTransaction(db, tx({ kind: 'receivable', amount: 1_000_00, contact_id: ahmed }));
  await updateTransaction(db, id, tx({ kind: 'payable', amount: 300_00, contact_id: ahmed }));
  assert.equal((await getContact(db, ahmed))!.balance, -300_00);
  await assert.rejects(deleteContact(db, ahmed), UserError);
  await createTransaction(db, tx({ kind: 'income', amount: 1, account_id: bank }));
  await assert.rejects(deleteAccount(db, bank), UserError);
});

test('duplicate contact names are rejected (normalized)', async () => {
  const { db } = await setup();
  await assert.rejects(createContact(db, { name: 'احمد محمود', phone: null, notes: null }), UserError);
});

test('search finds contacts regardless of hamza / taa marbuta', async () => {
  const { db, ahmed, fatma } = await setup();
  assert.deepEqual((await listContacts(db, { search: 'احمد' })).map((c) => c.id), [ahmed]);
  assert.deepEqual((await listContacts(db, { search: 'فاطمه' })).map((c) => c.id), [fatma]);
  assert.deepEqual((await listContacts(db, { search: '0100' })).map((c) => c.id), [ahmed]);
  assert.deepEqual(await listContacts(db, { search: '%' }), []);
});

test('report aggregates by kind/category, excludes transfers from cash flow, closes as of period end', async () => {
  const { db, bank, wallet, ahmed } = await setup();
  const [rent] = (await listCategories(db, 'expense_business')).filter((c) => c.name === 'إيجار المكتب');
  const [audit] = (await listCategories(db, 'income')).filter((c) => c.name === 'أتعاب مراجعة حسابات');

  await createTransaction(db, tx({ kind: 'income', amount: 20_000_00, account_id: bank, category_id: audit.id, date: '2026-11-03' }));
  await createTransaction(db, tx({ kind: 'income', amount: 5_000_00, account_id: bank, date: '2026-11-04' }));
  await createTransaction(db, tx({ kind: 'expense_business', amount: 4_000_00, account_id: bank, category_id: rent.id, date: '2026-11-05' }));
  await createTransaction(db, tx({ kind: 'expense_personal', amount: 1_000_00, account_id: bank, date: '2026-11-06' }));
  await createTransaction(db, tx({ kind: 'tax', amount: 2_000_00, account_id: bank, date: '2026-11-07' }));
  await createTransaction(db, tx({ kind: 'transfer', amount: 3_000_00, account_id: bank, to_account_id: wallet, date: '2026-11-08' }));
  await createTransaction(db, tx({ kind: 'receivable', amount: 7_000_00, contact_id: ahmed, date: '2026-11-09' }));
  // Outside the period:
  await createTransaction(db, tx({ kind: 'income', amount: 99_00, account_id: bank, date: '2026-10-31' }));
  await createTransaction(db, tx({ kind: 'collection', amount: 7_000_00, contact_id: ahmed, account_id: bank, date: '2026-12-01' }));

  const r = await buildReport(db, '2026-11-01', '2026-11-30', { from: '2026-10-01', to: '2026-10-31' });
  assert.equal(r.income, 25_000_00);
  assert.equal(r.businessExpenses, 4_000_00);
  assert.equal(r.personalExpenses, 1_000_00);
  assert.equal(r.taxes, 2_000_00);
  assert.equal(r.netBusinessProfit, 19_000_00);
  assert.equal(r.cashIn, 25_000_00);
  assert.equal(r.cashOut, 7_000_00);
  assert.equal(r.netCashFlow, 18_000_00);
  assert.deepEqual(
    r.kinds.income.categories.map((c) => [c.category, c.total]),
    [['أتعاب مراجعة حسابات', 20_000_00], ['بدون تصنيف', 5_000_00]],
  );
  assert.equal(r.kinds.transfer.total, 3_000_00);
  const w = r.accounts.find((a) => a.id === wallet)!;
  assert.deepEqual([w.in, w.out, w.closing], [3_000_00, 0, 3_000_00]);
  // As of 30 Nov Ahmed still owes 7,000 (collection happens 1 Dec).
  assert.equal(r.owedToMe, 7_000_00);
  assert.deepEqual(r.topDebtors.map((c) => [c.id, c.balance]), [[ahmed, 7_000_00]]);
  assert.equal(r.previous?.income, 99_00);
  assert.equal(r.transactions.length, 7);
});

test('backup export → import round-trips exactly', async () => {
  const { db, bank, ahmed } = await setup();
  await createTransaction(db, tx({ kind: 'loan_given', amount: 1_234_56, contact_id: ahmed, account_id: bank, note: 'ملاحظة' }));
  const dump = await exportAll(db);
  const json = JSON.stringify(dump);

  const fresh: Db = openTestDb();
  await migrate(fresh);
  await importAll(fresh, parseBackup(json));
  const again = await exportAll(fresh);
  assert.deepEqual({ ...again, exportedAt: '' }, { ...dump, exportedAt: '' });
  assert.equal((await getContact(fresh, ahmed))!.balance, 1_234_56);
  assert.throws(() => parseBackup('{"app":"other"}'), UserError);
  assert.throws(() => parseBackup('not json'), UserError);
});
