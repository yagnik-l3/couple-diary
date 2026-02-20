import { useAppState } from '@/utils/store';
import { getProfile } from '@/utils/supabase';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function MainLayout() {
    const router = useRouter();
    const { update } = useAppState();

    useEffect(() => {
        (async () => {
            try {
                const profile = await getProfile();
                if (!profile?.couple_id) {
                    // Not paired — send back to onboarding invite step
                    router.replace('/onboarding?resume=invite');
                    return;
                }
                // Refresh store with latest profile data — done once here so
                // individual screens (home, etc.) don't need to re-fetch.
                update({
                    streakCount: profile.streak_count,
                    bestStreak: profile.best_streak,
                    partnerName: profile.partner_name,
                    userFirstName: profile.first_name || profile.name,
                    userLastName: profile.last_name || '',
                    userEmail: profile.email || '',
                    userGender: profile.gender || '',
                    userBirthDate: profile.birth_date || '',
                    relationshipDate: profile.relationship_date || '',
                    topicPreferences: profile.topic_preferences || [],
                    lives: profile.lives || 1,
                    hasPartner: true,
                    questionsAnswered: profile.questions_answered || 0,
                    avatarUrl: profile.avatar_url || '',
                    partnerAvatarUrl: profile.partner_avatar_url || '',
                    coupleVibe: profile.couple_vibe || '',
                    coupleEditorId: profile.editor_user_id || '',
                    userId: profile.userId,
                    lastNudgeAt: profile.last_nudge_at || '',
                    nudgeNotificationsEnabled: profile.nudge_notifications_enabled,
                    dailyRemindersEnabled: profile.daily_reminders_enabled,
                    reminderTime: profile.reminder_time,
                    coupleId: profile.couple_id || '',
                });
            } catch {
                // If profile fetch fails, let them through (auth guard handles the rest)
            }
        })();
    }, []);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#0B0D2E' },
                animation: 'fade',
            }}
        />
    );
}
