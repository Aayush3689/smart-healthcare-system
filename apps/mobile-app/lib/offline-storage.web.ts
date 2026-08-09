// The production app targets iOS and Android, where offline-storage.ts uses SQLite.
// This lightweight browser fallback keeps Expo web previews functional.
type QueueOperation = 'upsert' | 'delete';

type StoredRecord = Record<string, unknown> & { id?: string | number };
type QueueEntry = { id: string; entityType: string; entityId: string; operation: QueueOperation; payload: StoredRecord };

const queue: QueueEntry[] = [];
const SYNC_API_URL = process.env.EXPO_PUBLIC_SYNC_API_URL;

export const createUuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
  const random = Math.floor(Math.random() * 16);
  return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16);
});

export const offlineStorage = {
  async getItem(key: string) {
    return localStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    const previous = localStorage.getItem(key);
    localStorage.setItem(key, value);
    if (key === 'patients' || key === 'healthAssessments') {
      const parseRecords = (raw: string | null): StoredRecord[] => {
        try {
          const parsed: unknown = JSON.parse(raw ?? '[]');
          return Array.isArray(parsed) ? (parsed as StoredRecord[]) : [];
        } catch {
          return [];
        }
      };
      const before = new Map(parseRecords(previous).map((item) => [String(item.id ?? ''), item]));
      const after = new Map(parseRecords(value).map((item) => [String(item.id ?? ''), item]));
      const entityType = key === 'patients' ? 'patient' : 'assessment';

      after.forEach((item, id) => {
        if (id && JSON.stringify(before.get(id)) !== JSON.stringify(item)) {
          queue.push({ id: createUuid(), entityType, entityId: id, operation: 'upsert', payload: item });
        }
      });
      before.forEach((item, id) => {
        if (id && !after.has(id)) {
          queue.push({ id: createUuid(), entityType, entityId: id, operation: 'delete', payload: item });
        }
      });
    }
    void syncPendingChanges();
  },
};

export const syncPendingChanges = async () => {
  if (!SYNC_API_URL || !navigator.onLine) return;
  const entries = [...queue];
  for (const entry of entries) {
    try {
      const response = await fetch(SYNC_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueId: entry.id,
          entityType: entry.entityType,
          entityId: entry.entityId,
          operation: entry.operation,
          payload: entry.payload,
        }),
      });
      if (response.ok) queue.splice(queue.findIndex((item) => item.id === entry.id), 1);
    } catch {}
  }
};

export const startSyncMonitoring = () => {
  window.addEventListener('online', () => { void syncPendingChanges(); });
  void syncPendingChanges();
};
