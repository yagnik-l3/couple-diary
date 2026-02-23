import { QuestionService } from '@/utils/questionService';
import { updatePushToken } from '@/utils/supabase';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// ─── Configure notification behavior ──────────────────
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// ─── Register for push notifications ──────────────────
async function registerForPushNotificationsAsync(): Promise<string | null> {
    // Push notifications only work on physical devices
    if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return null;
    }

    // Android needs notification channels
    if (Platform.OS === 'android') {
        // Default channel (required)
        await Notifications.setNotificationChannelAsync('default', {
            name: 'General',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#6C3DB8',
            showBadge: true,
        });
        // Daily question reminder channel
        await Notifications.setNotificationChannelAsync('daily-question', {
            name: 'Daily Questions',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF69B4',
            showBadge: true,
        });
        // Partner activity channel (answers, nudges)
        await Notifications.setNotificationChannelAsync('partner-activity', {
            name: 'Partner Activity',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 100, 100, 100],
            lightColor: '#6C3DB8',
            showBadge: true,
        });
    }

    // Check / request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') {
        console.log('Notification permission not granted');
        return null;
    }

    // Get the Expo push token (requires EAS project ID)
    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (!projectId) {
            console.warn('No EAS project ID found in app config. Push tokens may not work.');
        }
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
        });
        return tokenData.data;
    } catch (err) {
        console.error('Failed to get Expo push token:', err);
        return null;
    }
}

// ─── Hook ─────────────────────────────────────────────
export function useNotifications() {
    const router = useRouter();
    const notificationListener = useRef<Notifications.EventSubscription>(undefined);
    const responseListener = useRef<Notifications.EventSubscription>(undefined);

    useEffect(() => {
        // Register and store token
        registerForPushNotificationsAsync().then(async (token) => {
            if (token) {
                try {
                    await updatePushToken(token);
                } catch (err) {
                    console.warn('Failed to save push token:', err);
                }
            }
        });

        // Listen for incoming notifications (foreground)
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
            console.log('Notification received:', notification.request.content.title);
        });

        // Listen for notification taps (background/quit → open)
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data;
            handleNotificationNavigation(data);
        });

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, []);

    // ─── Navigation handler ────────────────────────────
    const handleNotificationNavigation = async (data: Record<string, unknown>) => {
        const type = data?.type as string | undefined;

        switch (type) {
            case 'partner_answered': {
                // Partner has answered — navigate based on whether WE have answered yet
                const dailyId = data.daily_id as string | undefined;
                if (!dailyId) {
                    router.push('/(main)/question');
                    break;
                }
                try {
                    const { hasAnswered } = await QuestionService.getAnswerStatus(dailyId);
                    if (hasAnswered) {
                        // We already answered → go to the reveal screen to see both answers
                        router.push({
                            pathname: '/(main)/reveal',
                            params: { daily_id: dailyId },
                        } as any);
                    } else {
                        // We haven't answered yet → show the question screen
                        router.push('/(main)/question');
                    }
                } catch {
                    // Fallback to question screen on error
                    router.push('/(main)/question');
                }
                break;
            }

            case 'nudge':
                // Partner nudged us to answer today's question
                router.push('/(main)/question');
                break;

            case 'new_question':
                router.push('/(main)/question');
                break;

            case 'level_up':
                router.push('/(main)/levels');
                break;

            case 'streak_warning':
                // Streak is about to expire — go answer the question
                router.push('/(main)/question');
                break;

            default:
                router.push('/(main)/home');
                break;
        }
    };
}
