import { useNotifications } from '@/hooks/useNotifications';
import { useAppState } from '@/utils/store';
import { getProfile } from '@/utils/supabase';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function MainLayout() {
    const router = useRouter();
    const { update } = useAppState();
    useNotifications();

    useEffect(() => {
        (async () => {
            try {
                const profile = await getProfile();
                if (!profile?.couple_id) {
                    // Not paired — send back to onboarding invite step
                    router.replace('/onboarding?resume=invite');
                    return;
                }
                // 1. Refresh store with latest profile data
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
                    sawStreakLost: profile.sawStreakLost,
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

                // 2. Perform streak check
                const { QuestionService } = await import('@/utils/questionService');
                const { handleStreakLoss } = await import('@/utils/supabase');
                const status = await QuestionService.checkStreakStatus();

                if (status === 'LOST') {
                    if (profile.streak_count > 0) {
                        // This launch just DETECTED the loss. 
                        // Reset everything in DB and set saw flags to false.
                        await handleStreakLoss();
                        // Then navigate
                        router.replace('/(main)/streak-lost');
                    } else if (!profile.sawStreakLost) {
                        // Already reset in DB by partner, but this user hasn't seen the screen yet.
                        router.replace('/(main)/streak-lost');
                    }
                }

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
