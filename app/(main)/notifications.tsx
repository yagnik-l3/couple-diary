import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { ms, vs } from '@/utils/scale';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

// ─── Mock Notifications ──────────────────────────────
const NOTIFICATIONS = [
    {
        id: '1',
        icon: '💬',
        title: 'Partner answered today\'s question!',
        body: 'Tap to reveal their answer',
        time: '2 min ago',
        unread: true,
    },
    {
        id: '2',
        icon: '🔥',
        title: '12-day streak! 🎉',
        body: 'You\'re on fire! Keep answering together.',
        time: '1 hour ago',
        unread: true,
    },
    {
        id: '3',
        icon: '⭐',
        title: 'New level unlocked',
        body: 'You\'ve become Constellation Makers!',
        time: '3 hours ago',
        unread: false,
    },
    {
        id: '4',
        icon: '💌',
        title: 'Don\'t forget today\'s question',
        body: 'Your partner is waiting for your answer.',
        time: 'Yesterday',
        unread: false,
    },
    {
        id: '5',
        icon: '🌟',
        title: 'Weekly recap is ready',
        body: 'See your highlights from this week.',
        time: 'Yesterday',
        unread: false,
    },
    {
        id: '6',
        icon: '💫',
        title: 'Partner sent a nudge!',
        body: '"Missing your answer today 💕"',
        time: '2 days ago',
        unread: false,
    },
];

export default function NotificationScreen() {
    const router = useRouter();

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

                {/* List */}
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {NOTIFICATIONS.map((notif, index) => (
                        <Animated.View
                            key={notif.id}
                            entering={FadeInUp.delay(index * 60).duration(400)}
                        >
                            <TouchableOpacity activeOpacity={0.8}>
                                <View style={[
                                    styles.notifCard,
                                    notif.unread && styles.notifCardUnread,
                                ]}>
                                    <View style={styles.iconCircle}>
                                        <Text style={styles.iconText}>{notif.icon}</Text>
                                    </View>
                                    <View style={styles.notifContent}>
                                        <Text style={[
                                            styles.notifTitle,
                                            notif.unread && styles.notifTitleUnread,
                                        ]} numberOfLines={1}>
                                            {notif.title}
                                        </Text>
                                        <Text style={styles.notifBody} numberOfLines={2}>
                                            {notif.body}
                                        </Text>
                                    </View>
                                    <Text style={styles.notifTime}>{notif.time}</Text>
                                    {notif.unread && <View style={styles.unreadDot} />}
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}

                    <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.endLabel}>
                        <Text style={styles.endText}>You're all caught up ✨</Text>
                    </Animated.View>
                </ScrollView>
            </View>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: vs(56),
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
        fontSize: 15,
    },
    headerTitle: {
        ...Typography.bodySemiBold,
        fontSize: ms(18),
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: vs(40),
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
        fontSize: ms(20),
    },
    notifContent: {
        flex: 1,
        gap: 2,
    },
    notifTitle: {
        ...Typography.bodyMedium,
        fontSize: ms(14),
        color: Colors.textSecondary,
    },
    notifTitleUnread: {
        ...Typography.bodySemiBold,
        color: Colors.textPrimary,
    },
    notifBody: {
        ...Typography.caption,
        fontSize: ms(12),
        color: Colors.textMuted,
        lineHeight: ms(16),
    },
    notifTime: {
        ...Typography.caption,
        fontSize: ms(10),
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
        fontSize: ms(13),
        color: Colors.textMuted,
    },
});
