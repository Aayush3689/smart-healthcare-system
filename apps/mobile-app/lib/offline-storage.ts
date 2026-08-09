import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

type QueueOperation = 'upsert' | 'delete';
type StoredRecord = Record<string, unknown> & { id?: string | number };

const DATABASE_NAME = 'healthcare-ai.db';
const SYNC_API_URL = process.env.EXPO_PUBLIC_SYNC_API_URL;
const SYNCABLE_KEYS = new Set(['patients', 'healthAssessments']);
const SYNC_RETRY_INTERVAL_MS = 30_000;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let syncing = false;
let monitoringStarted = false;

const getDatabase = async () => {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (database) => {
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS app_records (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          operation TEXT NOT NULL,
          payload TEXT NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          last_error TEXT,
          created_at TEXT NOT NULL
        );
      `);
      return database;
    });
  }
  return databasePromise;
};

const parseRecords = (value: string | null): StoredRecord[] => {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as StoredRecord[]) : [];
  } catch {
    return [];
  }
};

const queueId = () => `queue-${createUuid()}`;

const enqueueChange = async (
  entityType: string,
  entityId: string,
  operation: QueueOperation,
  payload: StoredRecord
) => {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, attempts, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)
     ON CONFLICT(id) DO NOTHING`,
    [queueId(), entityType, entityId, operation, JSON.stringify(payload), new Date().toISOString()]
  );
};

const enqueueArrayChanges = async (key: string, previous: string | null, next: string) => {
  if (!SYNCABLE_KEYS.has(key)) return;
  const oldRecords = new Map(parseRecords(previous).map((record) => [String(record.id ?? ''), record]));
  const newRecords = new Map(parseRecords(next).map((record) => [String(record.id ?? ''), record]));

  for (const [id, record] of newRecords) {
    if (!id) continue;
    const oldRecord = oldRecords.get(id);
    if (JSON.stringify(oldRecord) !== JSON.stringify(record)) {
      await enqueueChange(key === 'patients' ? 'patient' : 'assessment', id, 'upsert', record);
    }
  }

  for (const [id, record] of oldRecords) {
    if (id && !newRecords.has(id)) {
      await enqueueChange(key === 'patients' ? 'patient' : 'assessment', id, 'delete', record);
    }
  }
};

const migrateLegacyValue = async (key: string) => {
  const database = await getDatabase();
  const current = await database.getFirstAsync<{ value: string }>('SELECT value FROM app_records WHERE key = ?', [key]);
  if (current) return current.value;

  const legacyValue = await AsyncStorage.getItem(key);
  if (legacyValue !== null) {
    await database.runAsync('INSERT INTO app_records (key, value, updated_at) VALUES (?, ?, ?)', [key, legacyValue, new Date().toISOString()]);
  }
  return legacyValue;
};

export const offlineStorage = {
  async getItem(key: string): Promise<string | null> {
    return migrateLegacyValue(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    const database = await getDatabase();
    const previous = await database.getFirstAsync<{ value: string }>('SELECT value FROM app_records WHERE key = ?', [key]);
    await database.runAsync(
      `INSERT INTO app_records (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [key, value, new Date().toISOString()]
    );
    await enqueueArrayChanges(key, previous?.value ?? null, value);
    void syncPendingChanges();
  },
};

export const createUuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
  const random = Math.floor(Math.random() * 16);
  const value = character === 'x' ? random : (random & 0x3) | 0x8;
  return value.toString(16);
});

export const syncPendingChanges = async () => {
  if (syncing || !SYNC_API_URL) return;
  const network = await NetInfo.fetch();
  if (!network.isConnected || !network.isInternetReachable) return;

  syncing = true;
  try {
    const database = await getDatabase();
    const entries = await database.getAllAsync<{
      id: string;
      entity_type: string;
      entity_id: string;
      operation: QueueOperation;
      payload: string;
    }>('SELECT id, entity_type, entity_id, operation, payload FROM sync_queue ORDER BY created_at ASC');

    await Promise.all(entries.map(async (entry) => {
      try {
        const response = await fetch(SYNC_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            queueId: entry.id,
            entityType: entry.entity_type,
            entityId: entry.entity_id,
            operation: entry.operation,
            payload: JSON.parse(entry.payload) as StoredRecord,
          }),
        });
        if (!response.ok) throw new Error(`Sync failed with status ${response.status}`);
        await database.runAsync('DELETE FROM sync_queue WHERE id = ?', [entry.id]);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown sync error';
        await database.runAsync('UPDATE sync_queue SET attempts = attempts + 1, last_error = ? WHERE id = ?', [message, entry.id]);
      }
    }));
  } finally {
    syncing = false;
  }
};

export const startSyncMonitoring = () => {
  if (monitoringStarted) return;
  monitoringStarted = true;
  NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable) void syncPendingChanges();
  });
  setInterval(() => {
    void syncPendingChanges();
  }, SYNC_RETRY_INTERVAL_MS);
  void syncPendingChanges();
};
