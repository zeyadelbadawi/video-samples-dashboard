import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { exportAll, getMeta, importAll, parseBackup, setMeta, UserError, type BackupData } from '@/db/queries';
import type { Db } from '@/db/types';
import { today } from './dates';

/**
 * Three layers of protection for the data:
 *  1. The SQLite file lives in Documents/, which iOS includes in iCloud / computer backups.
 *  2. Automatic daily JSON snapshots in Documents/backups (last 14 kept) — protects against
 *     mistakes inside the app (deleted records, a bad import).
 *  3. Manual export: a JSON file the user saves to iCloud Drive / Files / sends to themselves —
 *     the only layer that survives losing the phone without an iCloud backup.
 */

const KEEP_AUTO = 14;
const LAST_EXPORT_KEY = 'last_manual_export';
const LAST_AUTO_KEY = 'last_auto_backup';

function backupsDir(): Directory {
  const dir = new Directory(Paths.document, 'backups');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

async function writeBackupFile(name: string, data: BackupData): Promise<File> {
  const file = new File(backupsDir(), name);
  if (file.exists) file.delete();
  file.create();
  await file.write(JSON.stringify(data));
  return file;
}

/** Creates today's snapshot once per day and prunes old ones. Safe to call on every launch. */
export async function autoBackupIfDue(db: Db): Promise<void> {
  const day = today();
  if ((await getMeta(db, LAST_AUTO_KEY)) === day) return;
  const data = await exportAll(db);
  const hasData = data.data.transactions.length + data.data.contacts.length > 0;
  if (!hasData) return;
  await writeBackupFile(`auto-${day}.json`, data);
  await setMeta(db, LAST_AUTO_KEY, day);

  const autos = backupsDir()
    .list()
    .filter((f): f is File => f instanceof File && f.name.startsWith('auto-'))
    .sort((a, b) => b.name.localeCompare(a.name));
  for (const old of autos.slice(KEEP_AUTO)) old.delete();
}

export function listAutoBackups(): { name: string; file: File }[] {
  return backupsDir()
    .list()
    .filter((f): f is File => f instanceof File && f.name.endsWith('.json'))
    .sort((a, b) => b.name.localeCompare(a.name))
    .map((file) => ({ name: file.name, file }));
}

/** Writes a full export and opens the iOS share sheet (Save to Files / iCloud Drive / WhatsApp…). */
export async function exportAndShare(db: Db): Promise<void> {
  const data = await exportAll(db);
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const file = await writeBackupFile(`daftari-backup-${stamp}.json`, data);
  if (!(await Sharing.isAvailableAsync())) throw new UserError('المشاركة مش متاحة على الجهاز ده');
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'احفظ النسخة الاحتياطية',
  });
  await setMeta(db, LAST_EXPORT_KEY, new Date().toISOString());
}

export async function lastManualExport(db: Db): Promise<string | null> {
  return getMeta(db, LAST_EXPORT_KEY);
}

/** Lets the user pick a backup file. Returns null if cancelled. Does NOT import yet. */
export async function pickBackupFile(): Promise<{ name: string; backup: BackupData } | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'public.json', 'public.data', '*/*'],
    copyToCacheDirectory: true,
  });
  if (res.canceled) return null;
  const asset = res.assets[0];
  const text = await new File(asset.uri).text();
  return { name: asset.name, backup: parseBackup(text) };
}

export async function readBackupFile(file: File): Promise<BackupData> {
  return parseBackup(await file.text());
}

/** Snapshots current data first, then replaces everything with `backup`. */
export async function restore(db: Db, backup: BackupData): Promise<void> {
  const current = await exportAll(db);
  if (current.data.transactions.length + current.data.contacts.length > 0) {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    await writeBackupFile(`before-restore-${stamp}.json`, current);
  }
  await importAll(db, backup);
}
