import type { AccountType, Kind } from './kinds';

export type SqlParam = string | number | null;

/**
 * The subset of expo-sqlite's SQLiteDatabase the data layer uses.
 * Keeping it as an interface lets the same queries run under Node's sqlite in tests.
 */
export interface Db {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: SqlParam[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T>(sql: string, params: SqlParam[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params: SqlParam[]): Promise<T | null>;
  withExclusiveTransactionAsync(task: (txn: Db) => Promise<void>): Promise<void>;
}

export interface Contact {
  id: number;
  name: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

export interface ContactWithBalance extends Contact {
  balance: number;
  tx_count: number;
  last_date: string | null;
}

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  opening_balance: number;
  archived: number;
  created_at: string;
}

export interface AccountWithBalance extends Account {
  balance: number;
}

export interface Category {
  id: number;
  kind: Kind;
  name: string;
  archived: number;
}

export interface Transaction {
  id: number;
  kind: Kind;
  date: string;
  amount: number;
  account_id: number | null;
  to_account_id: number | null;
  contact_id: number | null;
  category_id: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionView extends Transaction {
  account_name: string | null;
  to_account_name: string | null;
  contact_name: string | null;
  category_name: string | null;
}

export interface TransactionInput {
  kind: Kind;
  date: string;
  amount: number;
  account_id: number | null;
  to_account_id: number | null;
  contact_id: number | null;
  category_id: number | null;
  note: string | null;
}
