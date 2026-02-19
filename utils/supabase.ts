import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ─── Secure token storage adapter ─────────────────────
const ExpoSecureStoreAdapter = {
    getItem: async (key: string): Promise<string | null> => {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },
    setItem: async (key: string, value: string): Promise<void> => {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
            return;
        }
        await SecureStore.setItemAsync(key, value);
    },
    removeItem: async (key: string): Promise<void> => {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
        }
        await SecureStore.deleteItemAsync(key);
    },
};

// ─── Client ───────────────────────────────────────────
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// ─── Auth Helpers ─────────────────────────────────────

/** Send OTP to email */
export async function sendOtp(email: string) {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
}

/** Verify OTP code */
export async function verifyOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
    });
    if (error) throw error;
    return data;
}

/** Sign out */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

/** Get current session */
export async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

/** Get current user ID */
export function getUserId() {
    // Synchronous helper — use only when you know session exists
    return supabase.auth.getUser().then(({ data }) => data.user?.id ?? null);
}

// ─── Profile Helpers ──────────────────────────────────

/** Generate a 6-char invite code */
function generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

/** Get profile + couple data for current user */
export async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!profile) return null;

    // Also fetch couple data if user is paired
    let coupleData = null;
    let partnerProfile = null;
    if (profile.couple_id) {
        const { data: couple } = await supabase
            .from('couples')
            .select('*')
            .eq('id', profile.couple_id)
            .single();
        coupleData = couple;

        // Fetch partner name
        if (couple) {
            const partnerId = couple.user_a === user.id ? couple.user_b : couple.user_a;
            const { data: partner } = await supabase
                .from('profiles')
                .select('first_name, name, avatar_url')
                .eq('id', partnerId)
                .single();
            partnerProfile = partner;
        }
    }

    // Fetch questions answered count
    const { count: questionsAnswered } = await supabase
        .from('answers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    // Merge for convenience — couple fields attached to profile result
    return {
        ...profile,
        // Couple-specific fields (may be null if no couple yet)
        relationship_date: coupleData?.relationship_date || null,
        topic_preferences: coupleData?.topic_preferences || [],
        couple_vibe: coupleData?.couple_vibe || '',
        couple_editor_id: coupleData?.editor_user_id || null,
        streak_count: coupleData?.streak_count || 0,
        best_streak: coupleData?.best_streak || 0,
        lives: coupleData?.lives || 1,
        partner_name: partnerProfile?.first_name || partnerProfile?.name || 'Partner',
        partner_avatar_url: partnerProfile?.avatar_url || null,
        questions_answered: questionsAnswered || 0,
    };
}

/** Create or update profile after onboarding (profiles table only) */
export async function createProfile(profile: {
    first_name: string;
    last_name: string;
    gender: string;
    email: string;
    birth_date?: string;
    reminder_time?: string;
    timezone?: string;
}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const profileFields = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        gender: profile.gender,
        email: profile.email || user.email || '',
        birth_date: profile.birth_date || null,
        reminder_time: profile.reminder_time || null,
        timezone: profile.timezone || null,
    };

    // Check if profile exists
    const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (existing) {
        const { data, error } = await supabase
            .from('profiles')
            .update(profileFields)
            .eq('id', user.id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    // Create new profile
    const { data, error } = await supabase
        .from('profiles')
        .insert({
            id: user.id,
            ...profileFields,
            invite_code: generateInviteCode(),
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/** Update profile fields (profiles table only) */
export async function updateProfile(updates: Record<string, any>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/** Update push token for current user */
export async function updatePushToken(pushToken: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('profiles')
        .update({ push_token: pushToken })
        .eq('id', user.id);

    if (error) console.warn('Failed to update push token:', error.message);
}

/** Mark onboarding as complete (called when partner connection confirmed) */
export async function completeOnboarding() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('id', user.id);

    if (error) throw error;
}

/** Update couple-specific fields (couples table) */
export async function updateCoupleData(updates: Record<string, any>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get the user's couple_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('couple_id')
        .eq('id', user.id)
        .single();

    if (!profile?.couple_id) throw new Error('Not paired with a partner yet');

    const { data, error } = await supabase
        .from('couples')
        .update(updates)
        .eq('id', profile.couple_id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/** Increment streak and update best_streak if needed.
 *  Uses daily_id to ensure streak only increments once per question. */
export async function incrementStreak(dailyId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
        .from('profiles')
        .select('couple_id')
        .eq('id', user.id)
        .single();

    if (!profile?.couple_id) throw new Error('Not paired');

    // Get current couple data
    const { data: couple } = await supabase
        .from('couples')
        .select('streak_count, best_streak, last_streak_daily_id')
        .eq('id', profile.couple_id)
        .single();

    // Already incremented for this question
    if (couple?.last_streak_daily_id === dailyId) {
        return couple;
    }

    const newStreak = (couple?.streak_count || 0) + 1;
    const newBest = Math.max(newStreak, couple?.best_streak || 0);

    const { data, error } = await supabase
        .from('couples')
        .update({
            streak_count: newStreak,
            best_streak: newBest,
            last_streak_daily_id: dailyId,
        })
        .eq('id', profile.couple_id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/** Reset streak to 0 */
export async function resetStreak() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
        .from('profiles')
        .select('couple_id')
        .eq('id', user.id)
        .single();

    if (!profile?.couple_id) return;

    await supabase
        .from('couples')
        .update({ streak_count: 0 })
        .eq('id', profile.couple_id);
}

/** Get current user's invite code */
export async function getInviteCode(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
        .from('profiles')
        .select('invite_code')
        .eq('id', user.id)
        .single();

    return data?.invite_code || null;
}

/** Look up a partner by invite code and create couple */
export async function joinPartner(inviteCode: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Find partner profile
    const { data: partner, error: findErr } = await supabase
        .from('profiles')
        .select('id, name, couple_id')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();

    if (findErr || !partner) throw new Error('Invalid invite code');
    if (partner.id === user.id) throw new Error("You can't pair with yourself");
    if (partner.couple_id) throw new Error('Partner is already paired');

    // Create couple
    const { data: couple, error: coupleErr } = await supabase
        .from('couples')
        .insert({ user_a: user.id, user_b: partner.id })
        .select()
        .single();

    if (coupleErr) throw coupleErr;

    // Update both profiles
    await supabase.from('profiles').update({ couple_id: couple.id }).eq('id', user.id);
    await supabase.from('profiles').update({ couple_id: couple.id }).eq('id', partner.id);

    return { couple, partnerName: partner.name };
}

/** Delete current user account */
export async function deleteUserAccount() {
    const { error } = await supabase.rpc('delete_user_account');
    if (error) throw error;
}
