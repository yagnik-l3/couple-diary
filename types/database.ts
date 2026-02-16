// ─── Database Types ───────────────────────────────────
// Matches the Supabase Postgres schema

export interface Profile {
    id: string;          // uuid — matches auth.users.id
    name: string;
    gender: string;
    email: string;
    avatar_url: string | null;
    invite_code: string;
    couple_id: string | null;
    push_token: string | null;
    created_at: string;
}

export interface Couple {
    id: string;
    user_a: string;      // profile id
    user_b: string;      // profile id
    relationship_date: string | null;
    streak_count: number;
    best_streak: number;
    lives: number;
    last_free_life_month: string;
    topic_preferences: string[];
    created_at: string;
}

export interface Question {
    id: string;
    text: string;
    category: string;
    created_at: string;
}

export interface DailyQuestion {
    id: string;
    couple_id: string;
    question_id: string;
    date: string;
}

export interface Answer {
    id: string;
    daily_question_id: string;
    user_id: string;
    content: string;
    created_at: string;
}

export interface JournalEntry {
    id: string;
    user_id: string;
    date: string;
    content: string;
    updated_at: string;
}

export interface Nudge {
    id: string;
    sender_id: string;
    couple_id: string;
    created_at: string;
}
