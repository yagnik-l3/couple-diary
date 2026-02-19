import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────
export interface JournalEntry {
    date: string;       // YYYY-MM-DD
    content: string;
    updatedAt: string;  // ISO string
}

// ─── Public API ───────────────────────────────────────

/** Get today's date as YYYY-MM-DD string (UTC). */
export function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}

/** Get a single entry by date (YYYY-MM-DD). Returns null if not found. */
export async function getEntry(date: string): Promise<JournalEntry | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
        date: data.date,
        content: data.content || '',
        updatedAt: data.updated_at,
    };
}

/** Save (upsert) an entry for a given date. */
export async function saveEntry(date: string, content: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('journal_entries')
        .upsert(
            {
                user_id: user.id,
                date,
                content,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,date' }
        );

    if (error) throw error;
}

/** Get all entries, sorted by date descending (newest first). */
export async function getAllEntries(): Promise<JournalEntry[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

    if (error) throw error;

    return (data || [])
        .filter(e => (e.content || '').trim().length > 0)
        .map(e => ({
            date: e.date,
            content: e.content || '',
            updatedAt: e.updated_at,
        }));
}

/** Get all entries within a date range (inclusive). Returns all entries including empty. */
export async function getWeekEntries(startDate: string, endDate: string): Promise<JournalEntry[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

    if (error) throw error;

    return (data || []).map(e => ({
        date: e.date,
        content: e.content || '',
        updatedAt: e.updated_at,
    }));
}
