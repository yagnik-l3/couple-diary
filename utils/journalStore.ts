import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────
export interface JournalEntry {
    date: string;       // YYYY-MM-DD
    content: string;
    updatedAt: string;  // ISO string
}

const STORAGE_KEY = '@couple_diary_journal';

// ─── Helpers ──────────────────────────────────────────
async function loadAll(): Promise<JournalEntry[]> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

async function persist(entries: JournalEntry[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ─── Public API ───────────────────────────────────────

/** Get a single entry by date (YYYY-MM-DD). Returns null if not found. */
export async function getEntry(date: string): Promise<JournalEntry | null> {
    const entries = await loadAll();
    return entries.find(e => e.date === date) ?? null;
}

/** Save (upsert) an entry for a given date. */
export async function saveEntry(date: string, content: string): Promise<void> {
    const entries = await loadAll();
    const idx = entries.findIndex(e => e.date === date);
    const entry: JournalEntry = {
        date,
        content,
        updatedAt: new Date().toISOString(),
    };
    if (idx >= 0) {
        entries[idx] = entry;
    } else {
        entries.push(entry);
    }
    await persist(entries);
}

/** Get all entries, sorted by date descending (newest first). */
export async function getAllEntries(): Promise<JournalEntry[]> {
    const entries = await loadAll();
    return entries
        .filter(e => e.content.trim().length > 0)
        .sort((a, b) => b.date.localeCompare(a.date));
}

/** Get today's date as YYYY-MM-DD string. */
export function getTodayDate(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
