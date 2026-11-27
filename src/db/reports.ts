import { contactEffectSql, KINDS, KIND_ORDER, type Kind } from './kinds';
import { accountBalancesAsOf, contactTotals, listTransactions } from './queries';
import type { AccountWithBalance, Db, TransactionView } from './types';

export interface CategoryLine {
  category: string;
  total: number;
  count: number;
}

export interface KindSection {
  kind: Kind;
  total: number;
  count: number;
  categories: CategoryLine[];
}

export interface AccountMovement {
  id: number;
  name: string;
  in: number;
  out: number;
  closing: number;
}

export interface ContactMovement {
  id: number;
  name: string;
  balance: number;
}

export interface Report {
  from: string;
  to: string;
  kinds: Record<Kind, KindSection>;
  income: number;
  businessExpenses: number;
  personalExpenses: number;
  taxes: number;
  /** income − business expenses − taxes */
  netBusinessProfit: number;
  /** all cash in − all cash out (excluding transfers between own accounts) */
  cashIn: number;
  cashOut: number;
  netCashFlow: number;
  accounts: AccountMovement[];
  closingCash: number;
  owedToMe: number;
  iOwe: number;
  topDebtors: ContactMovement[];
  topCreditors: ContactMovement[];
  transactions: TransactionView[];
  previous?: Pick<Report, 'income' | 'businessExpenses' | 'personalExpenses' | 'taxes' | 'netCashFlow'>;
}

function emptySections(): Record<Kind, KindSection> {
  return Object.fromEntries(KIND_ORDER.map((k) => [k, { kind: k, total: 0, count: 0, categories: [] }])) as unknown as Record<
    Kind,
    KindSection
  >;
}

export async function buildReport(
  db: Db,
  from: string,
  to: string,
  previous?: { from: string; to: string },
): Promise<Report> {
  const txs = await listTransactions(db, { from, to, order: 'asc' });
  const kinds = emptySections();
  const catMaps = new Map<Kind, Map<string, CategoryLine>>();
  let cashIn = 0;
  let cashOut = 0;
  const accIn = new Map<number, number>();
  const accOut = new Map<number, number>();
  const add = (m: Map<number, number>, id: number, v: number) => m.set(id, (m.get(id) ?? 0) + v);

  for (const t of txs) {
    const s = kinds[t.kind];
    s.total += t.amount;
    s.count += 1;
    if (KINDS[t.kind].hasCategories) {
      const name = t.category_name ?? 'بدون تصنيف';
      const m = catMaps.get(t.kind) ?? new Map<string, CategoryLine>();
      const line = m.get(name) ?? { category: name, total: 0, count: 0 };
      line.total += t.amount;
      line.count += 1;
      m.set(name, line);
      catMaps.set(t.kind, m);
    }
    if (t.kind === 'transfer') {
      if (t.account_id) add(accOut, t.account_id, t.amount);
      if (t.to_account_id) add(accIn, t.to_account_id, t.amount);
      continue;
    }
    const cash = KINDS[t.kind].cash;
    if (cash === 1) {
      cashIn += t.amount;
      if (t.account_id) add(accIn, t.account_id, t.amount);
    } else if (cash === -1) {
      cashOut += t.amount;
      if (t.account_id) add(accOut, t.account_id, t.amount);
    }
  }
  for (const [kind, m] of catMaps) {
    kinds[kind].categories = [...m.values()].sort((a, b) => b.total - a.total);
  }

  const closing: AccountWithBalance[] = await accountBalancesAsOf(db, to);
  const accounts: AccountMovement[] = closing.map((a) => ({
    id: a.id,
    name: a.name,
    in: accIn.get(a.id) ?? 0,
    out: accOut.get(a.id) ?? 0,
    closing: a.balance,
  }));

  const totals = await contactTotals(db, to);
  const contacts = await contactBalancesAsOf(db, to);

  const income = kinds.income.total;
  const businessExpenses = kinds.expense_business.total;
  const personalExpenses = kinds.expense_personal.total;
  const taxes = kinds.tax.total;

  const report: Report = {
    from,
    to,
    kinds,
    income,
    businessExpenses,
    personalExpenses,
    taxes,
    netBusinessProfit: income - businessExpenses - taxes,
    cashIn,
    cashOut,
    netCashFlow: cashIn - cashOut,
    accounts,
    closingCash: accounts.reduce((s, a) => s + a.closing, 0),
    owedToMe: totals.owedToMe,
    iOwe: totals.iOwe,
    topDebtors: contacts.filter((c) => c.balance > 0).slice(0, 10),
    topCreditors: contacts
      .filter((c) => c.balance < 0)
      .sort((a, b) => a.balance - b.balance)
      .slice(0, 10),
    transactions: txs,
  };

  if (previous) {
    const p = await buildReport(db, previous.from, previous.to);
    report.previous = {
      income: p.income,
      businessExpenses: p.businessExpenses,
      personalExpenses: p.personalExpenses,
      taxes: p.taxes,
      netCashFlow: p.netCashFlow,
    };
  }
  return report;
}

async function contactBalancesAsOf(db: Db, asOf: string): Promise<ContactMovement[]> {
  return db.getAllAsync<ContactMovement>(
    `SELECT c.id, c.name, SUM(${contactEffectSql('t')}) AS balance
       FROM contacts c
       JOIN transactions t ON t.contact_id = c.id AND t.date <= ?
      GROUP BY c.id
     HAVING balance <> 0
      ORDER BY balance DESC`,
    [asOf],
  );
}
