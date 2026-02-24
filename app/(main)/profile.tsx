import AvatarMerge from '@/components/AvatarMerge';
import FloatingCard from '@/components/FloatingCard';
import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import StreakBadge from '@/components/StreakBadge';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAppState } from '@/utils/store';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

const GENDER_MAP: Record<string, { label: string; icon: string }> = {
    'male': { label: 'Male', icon: '👨' },
    'female': { label: 'Female', icon: '👩' },
    'non-binary': { label: 'Non-Binary', icon: '🧑' },
    'prefer-not': { label: 'Prefer Not to Say', icon: '✨' },
};

const TOPIC_MAP: Record<string, { label: string; icon: string }> = {
    'love': { label: 'Love Languages', icon: '💕' },
    'dreams': { label: 'Dreams & Goals', icon: '🌠' },
    'intimacy': { label: 'Intimacy', icon: '🔥' },
    'fun': { label: 'Fun & Hypothetical', icon: '🎭' },
    'deep': { label: 'Deep Conversations', icon: '🌊' },
    'memories': { label: 'Past Memories', icon: '📸' },
    'future': { label: 'Future Together', icon: '🚀' },
    'gratitude': { label: 'Gratitude', icon: '🙏' },
};

export default function ProfileScreen() {
    const router = useRouter();
    const { state } = useAppState();

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    };

    return (
        <GradientBackground>
            <StarBackground />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity onPress={() => router.push('/(main)/edit-profile')} style={styles.editButton}>
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
            </View>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* Avatar & Names */}
                <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.profileSection}>
                    <AvatarMerge size={80} avatar1Uri={state.avatarUrl} avatar2Uri={state.partnerAvatarUrl} />
                    <Text style={styles.coupleNames}>
                        {state.userFirstName || 'You'} & {state.partnerName || 'Your Love'}
                    </Text>
                    <Text style={styles.since}>Together since {state.relationshipDate ? new Date(state.relationshipDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '...'} 💕</Text>
                </Animated.View>

                {/* Streak Badge */}
                <View style={styles.streakRow}>
                    <StreakBadge count={state.streakCount} size="lg" />
                </View>

                {/* Stats */}
                <Animated.View entering={FadeInUp.delay(400).duration(600)}>
                    <FloatingCard style={styles.statsCard}>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{state.streakCount}</Text>
                                <Text style={styles.statLabel}>Current{'\n'}Streak</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{state.bestStreak}</Text>
                                <Text style={styles.statLabel}>Best{'\n'}Streak</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{state.questionsAnswered}</Text>
                                <Text style={styles.statLabel}>Questions{'\n'}Answered</Text>
                            </View>
                        </View>
                    </FloatingCard>
                </Animated.View>

                {/* User Details */}
                <Animated.View entering={FadeInUp.delay(600).duration(600)}>
                    <Text style={styles.sectionTitle}>Your Details</Text>
                    <FloatingCard style={styles.detailsCard}>

                        {/* Email */}
                        <View style={styles.detailRow}>
                            <Text style={styles.detailIcon}>✉️</Text>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Email</Text>
                                <Text style={styles.detailValue}>{state.userEmail || 'No email'}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Gender */}
                        <View style={styles.detailRow}>
                            <Text style={styles.detailIcon}>{state.userGender ? GENDER_MAP[state.userGender]?.icon : '👤'}</Text>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Gender</Text>
                                <Text style={styles.detailValue}>{state.userGender ? GENDER_MAP[state.userGender]?.label : 'Not specified'}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Birth Date */}
                        <View style={styles.detailRow}>
                            <Text style={styles.detailIcon}>🎂</Text>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Birth Date</Text>
                                <Text style={styles.detailValue}>{formatDate(state.userBirthDate)}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Reminder Time */}
                        <View style={styles.detailRow}>
                            <Text style={styles.detailIcon}>🔔</Text>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Daily Reminder</Text>
                                <Text style={styles.detailValue}>
                                    {state.reminderTime
                                        ? (() => {
                                            const t = state.reminderTime.split(':');
                                            const h = parseInt(t[0]);
                                            const ampm = h >= 12 ? 'PM' : 'AM';
                                            const h12 = h % 12 || 12;
                                            return `${h12}:${t[1]} ${ampm}`;
                                        })()
                                        : 'Not set'}
                                </Text>
                            </View>
                        </View>

                    </FloatingCard>
                </Animated.View>

                {/* Couple Details */}
                <Animated.View entering={FadeInUp.delay(700).duration(600)}>
                    <Text style={styles.sectionTitle}>Couple Details</Text>
                    <FloatingCard style={styles.detailsCard}>

                        {/* Relationship Date */}
                        <View style={styles.detailRow}>
                            <Text style={styles.detailIcon}>📅</Text>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Relationship Start</Text>
                                <Text style={styles.detailValue}>{formatDate(state.relationshipDate)}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Couple Vibe */}
                        <View style={styles.detailRow}>
                            <Text style={styles.detailIcon}>✨</Text>
                            <View style={styles.detailContent}>
                                <Text style={[styles.detailValue, { textTransform: 'capitalize' }]}>
                                    {state.coupleVibe ? state.coupleVibe.replace('-', ' ') : 'Not set'}
                                </Text>
                            </View>
                        </View>

                    </FloatingCard>
                </Animated.View>

                {/* Topic Preferences */}
                <Animated.View entering={FadeInUp.delay(800).duration(600)}>
                    <Text style={styles.sectionTitle}>Daily Question Topics</Text>
                    <View style={styles.topicsGrid}>
                        {(state.topicPreferences || []).map((topicId) => (
                            <View key={topicId} style={styles.topicChip}>
                                <Text style={styles.topicIcon}>{TOPIC_MAP[topicId]?.icon || '❓'}</Text>
                                <Text style={styles.topicLabel}>{TOPIC_MAP[topicId]?.label || topicId}</Text>
                            </View>
                        ))}
                        {(!state.topicPreferences || state.topicPreferences.length === 0) && (
                            <Text style={styles.emptyText}>No topics selected</Text>
                        )}
                    </View>
                </Animated.View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Spacing.xs,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    headerTitle: {
        ...Typography.bodySemiBold,
        fontSize: Typography.h3.fontSize,
    },
    backText: {
        ...Typography.body,
        color: Colors.textSecondary,
    },
    editButton: {
        paddingHorizontal: Spacing.sm,
    },
    editText: {
        ...Typography.caption,
        color: Colors.softPink,
        fontSize: Typography.md.fontSize,
        fontWeight: '600',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    profileSection: {
        alignItems: 'center',
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.xl,
        gap: Spacing.sm,
    },
    coupleNames: {
        ...Typography.heading,
        fontSize: Typography.xxl.fontSize,
        marginTop: Spacing.md,
    },
    since: {
        ...Typography.caption,
        fontSize: Typography.md.fontSize,
    },
    streakRow: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    statsCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    statsRow: {
        flexDirection: 'row',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        ...Typography.heading,
        fontSize: Typography.xxl.fontSize,
        marginBottom: 4,
    },
    statLabel: {
        ...Typography.caption,
        fontSize: Typography.sm.fontSize,
        textAlign: 'center',
        lineHeight: 16,
    },
    statDivider: {
        width: 1,
        backgroundColor: Colors.white08,
    },
    sectionTitle: {
        ...Typography.bodySemiBold,
        fontSize: Typography.lg.fontSize,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        color: Colors.textPrimary,
        marginTop: Spacing.md,
    },
    detailsCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        padding: Spacing.md,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    detailIcon: {
        fontSize: Typography.xl.fontSize,
        marginRight: Spacing.md,
        width: 30,
        textAlign: 'center',
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        ...Typography.caption,
        color: Colors.textMuted,
        fontSize: Typography.sm.fontSize,
        marginBottom: 2,
    },
    detailValue: {
        ...Typography.body,
        color: Colors.textPrimary,
        fontSize: Typography.md.fontSize,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.white08,
        marginVertical: 4,
    },
    topicsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
    },
    topicChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white08,
        borderRadius: Radius.full,
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 8,
    },
    topicIcon: {
        fontSize: Typography.lg.fontSize,
    },
    topicLabel: {
        ...Typography.caption,
        color: Colors.textSecondary,
        fontSize: Typography.md.fontSize,
    },
    emptyText: {
        ...Typography.caption,
        color: Colors.textMuted,
        fontStyle: 'italic',
    },
    bottomSpacer: {
        height: 60,
    },
});
