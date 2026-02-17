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

    // Android needs a notification channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#6C3DB8',
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

    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
    });

    return tokenData.data;
}

// ─── Hook ─────────────────────────────────────────────
export function useNotifications() {
    const router = useRouter();
    const notificationListener = useRef<Notifications.EventSubscription>();
    const responseListener = useRef<Notifications.EventSubscription>();

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

    const handleNotificationNavigation = (data: Record<string, unknown>) => {
        const type = data?.type as string | undefined;

        switch (type) {
            case 'partner_answered':
                if (data.daily_id) {
                    router.push({ pathname: '/(main)/reveal', params: { daily_id: data.daily_id as string } } as any);
                }
                break;
            case 'nudge':
                router.push('/(main)/question');
                break;
            case 'new_question':
                router.push('/(main)/question');
                break;
            case 'level_up':
                router.push('/(main)/levels');
                break;
            case 'streak_warning':
                router.push('/(main)/question');
                break;
            default:
                router.push('/(main)/home');
                break;
        }
    };
}
