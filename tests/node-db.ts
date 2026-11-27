/// <reference types="node" />
// Adapter exposing Node's built-in sqlite through the same `Db` interface the app uses,
// so the real queries/migrations are tested against a real SQLite engine.
import { DatabaseSync } from 'node:sqlite';

import type { Db, SqlParam } from '../src/db/types';

export function openTestDb(): Db {
  const raw = new DatabaseSync(':memory:');
  const make = (): Db => ({
    async execAsync(sql) {
      raw.exec(sql);
    },
    async runAsync(sql, params: SqlParam[]) {
      const r = raw.prepare(sql).run(...params);
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
    async getAllAsync<T>(sql: string, params: SqlParam[]) {
      return raw.prepare(sql).all(...params) as T[];
    },
    async getFirstAsync<T>(sql: string, params: SqlParam[]) {
      return (raw.prepare(sql).get(...params) as T | undefined) ?? null;
    },
    async withExclusiveTransactionAsync(task) {
      raw.exec('BEGIN EXCLUSIVE');
      try {
        await task(make());
        raw.exec('COMMIT');
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      }
    },
  });
  return make();
}
