import GradientBackground from '@/components/GradientBackground';
import SkeletonLoader from '@/components/SkeletonLoader';
import StarBackground from '@/components/StarBackground';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { s } from '@/utils/scale';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

// ─── Types ───────────────────────────────────────────
interface NotificationItem {
    id: string;
    type: string;
    title: string;
    body: string;
    data: Record<string, any>;
    read: boolean;
    created_at: string;
}

// ─── Icon Map ────────────────────────────────────────
const ICON_MAP: Record<string, string> = {
    partner_answered: '💬',
    nudge: '💌',
    new_question: '✨',
    level_up: '⭐',
    streak_warning: '🔥',
};

function timeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
}

export default function NotificationScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setNotifications(data || []);
        } catch (err) {
            console.warn('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchNotifications();
    }, [fetchNotifications]);

    // Mark all visible as read
    useEffect(() => {
        const unread = notifications.filter(n => !n.read).map(n => n.id);
        if (unread.length > 0) {
            supabase
                .from('notifications')
                .update({ read: true })
                .in('id', unread)
                .then(() => {
                    // Silently mark as read
                });
        }
    }, [notifications]);

    const handleNotifPress = (notif: NotificationItem) => {
        switch (notif.type) {
            case 'partner_answered':
                if (notif.data?.daily_id) {
                    router.push({ pathname: '/(main)/reveal', params: { daily_id: notif.data.daily_id } } as any);
                }
                break;
            case 'nudge':
            case 'new_question':
            case 'streak_warning':
                router.push('/(main)/question');
                break;
            case 'level_up':
                router.push('/(main)/levels');
                break;
        }
    };

    return (
        <GradientBackground>
            <StarBackground />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>🔔 Notifications</Text>
                    <View style={{ width: 50 }} />
                </View>

                {loading ? (
                    <View style={styles.scrollContent}>
                        {/* Header Skeleton */}
                        <View style={{ marginBottom: Spacing.lg }}>
                            <SkeletonLoader.Line width={120} height={24} />
                            <SkeletonLoader.Line width={200} height={14} />
                        </View>

                        {/* List Skeleton */}
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <View key={i} style={{
                                flexDirection: 'row',
                                padding: Spacing.md,
                                gap: Spacing.md,
                                marginBottom: 2
                            }}>
                                <SkeletonLoader.Base width={42} height={42} borderRadius={21} />
                                <View style={{ flex: 1, justifyContent: 'center', gap: 6 }}>
                                    <SkeletonLoader.Line width="60%" height={14} style={{ marginBottom: 0 }} />
                                    <SkeletonLoader.Line width="90%" height={12} style={{ marginBottom: 0 }} />
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={Colors.softPink}
                            />
                        }
                    >
                        {notifications.length === 0 ? (
                            <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
                                <Text style={styles.emptyIcon}>🔔</Text>
                                <Text style={styles.emptyText}>No notifications yet</Text>
                                <Text style={styles.emptySubtext}>
                                    Answer questions and keep your streak going!
                                </Text>
                            </Animated.View>
                        ) : (
                            <>
                                {notifications.map((notif, index) => (
                                    <Animated.View
                                        key={notif.id}
                                        entering={FadeInUp.delay(index * 60).duration(400)}
                                    >
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => handleNotifPress(notif)}
                                        >
                                            <View style={[
                                                styles.notifCard,
                                                !notif.read && styles.notifCardUnread,
                                            ]}>
                                                <View style={styles.iconCircle}>
                                                    <Text style={styles.iconText}>
                                                        {ICON_MAP[notif.type] || '🔔'}
                                                    </Text>
                                                </View>
                                                <View style={styles.notifContent}>
                                                    <Text style={[
                                                        styles.notifTitle,
                                                        !notif.read && styles.notifTitleUnread,
                                                    ]} numberOfLines={1}>
                                                        {notif.title}
                                                    </Text>
                                                    <Text style={styles.notifBody} numberOfLines={2}>
                                                        {notif.body}
                                                    </Text>
                                                </View>
                                                <Text style={styles.notifTime}>
                                                    {timeAgo(notif.created_at)}
                                                </Text>
                                                {!notif.read && <View style={styles.unreadDot} />}
                                            </View>
                                        </TouchableOpacity>
                                    </Animated.View>
                                ))}

                                <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.endLabel}>
                                    <Text style={styles.endText}>You're all caught up ✨</Text>
                                </Animated.View>
                            </>
                        )}
                    </ScrollView>
                )}
            </View>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Spacing.xs,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    backText: {
        ...Typography.body,
        color: Colors.textSecondary,
    },
    headerTitle: {
        ...Typography.bodySemiBold,
        fontSize: s(18),
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: s(40),
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: s(80),
    },
    emptyIcon: {
        fontSize: s(48),
        marginBottom: Spacing.md,
    },
    emptyText: {
        ...Typography.bodySemiBold,
        fontSize: s(18),
        marginBottom: Spacing.sm,
    },
    emptySubtext: {
        ...Typography.body,
        color: Colors.textMuted,
        fontSize: s(14),
        textAlign: 'center',
    },
    notifCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.lg,
        marginBottom: 2,
        gap: Spacing.md,
    },
    notifCardUnread: {
        backgroundColor: Colors.white08,
    },
    iconCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: Colors.white08,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconText: {
        fontSize: s(20),
    },
    notifContent: {
        flex: 1,
        gap: 2,
    },
    notifTitle: {
        ...Typography.bodyMedium,
        fontSize: s(14),
        color: Colors.textSecondary,
    },
    notifTitleUnread: {
        ...Typography.bodySemiBold,
        color: Colors.textPrimary,
    },
    notifBody: {
        ...Typography.caption,
        fontSize: s(12),
        color: Colors.textMuted,
        lineHeight: s(16),
    },
    notifTime: {
        ...Typography.caption,
        fontSize: s(10),
        color: Colors.textMuted,
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.md,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.softPink,
        position: 'absolute',
        top: Spacing.md + 2,
        left: Spacing.md - 2,
    },
    endLabel: {
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    endText: {
        ...Typography.caption,
        fontSize: s(13),
        color: Colors.textMuted,
    },
});
