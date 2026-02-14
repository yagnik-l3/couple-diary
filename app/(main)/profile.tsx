import AvatarMerge from '@/components/AvatarMerge';
import FloatingCard from '@/components/FloatingCard';
import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import StreakBadge from '@/components/StreakBadge';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

const MILESTONES = [
    { day: 7, label: 'First Week', icon: '🌟', achieved: true },
    { day: 14, label: 'Two Weeks', icon: '💫', achieved: false },
    { day: 30, label: 'One Month', icon: '🌙', achieved: false },
    { day: 100, label: 'Century', icon: '🪐', achieved: false },
    { day: 365, label: 'One Year', icon: '🌌', achieved: false },
];

export default function ProfileScreen() {
    const router = useRouter();

    return (
        <GradientBackground>
            <StarBackground />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                </View>

                {/* Avatar & Names */}
                <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.profileSection}>
                    <AvatarMerge size={80} />
                    <Text style={styles.coupleNames}>You & Your Love</Text>
                    <Text style={styles.since}>Together since Dec 2025 💕</Text>
                </Animated.View>

                {/* Streak Badge */}
                <View style={styles.streakRow}>
                    <StreakBadge count={12} size="lg" />
                </View>

                {/* Stats */}
                <Animated.View entering={FadeInUp.delay(400).duration(600)}>
                    <FloatingCard style={styles.statsCard}>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>12</Text>
                                <Text style={styles.statLabel}>Current{'\n'}Streak</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>12</Text>
                                <Text style={styles.statLabel}>Best{'\n'}Streak</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>12</Text>
                                <Text style={styles.statLabel}>Questions{'\n'}Answered</Text>
                            </View>
                        </View>
                    </FloatingCard>
                </Animated.View>

                {/* Milestones */}
                <Animated.View entering={FadeInUp.delay(600).duration(600)}>
                    <Text style={styles.sectionTitle}>Milestones</Text>
                    <FloatingCard style={styles.milestonesCard}>
                        {MILESTONES.map((m, i) => (
                            <View key={i} style={styles.milestoneRow}>
                                <Text style={[styles.milestoneIcon, !m.achieved && styles.milestoneIconLocked]}>
                                    {m.achieved ? m.icon : '🔒'}
                                </Text>
                                <View style={styles.milestoneInfo}>
                                    <Text style={[styles.milestoneName, !m.achieved && styles.milestoneLocked]}>
                                        {m.label}
                                    </Text>
                                    <Text style={styles.milestoneDays}>Day {m.day}</Text>
                                </View>
                                {m.achieved && <Text style={styles.milestoneCheck}>✓</Text>}
                            </View>
                        ))}
                    </FloatingCard>
                </Animated.View>

                {/* Theme Preview */}
                <Animated.View entering={FadeInUp.delay(800).duration(600)}>
                    <Text style={styles.sectionTitle}>Theme</Text>
                    <View style={styles.themeRow}>
                        {([
                            ['#0B0D2E', '#1A1B4B', '#3D2C6E'] as const,
                            ['#1A0A2E', '#3D1B5E', '#7B2D8E'] as const,
                            ['#0E1428', '#1A2744', '#2C4066'] as const,
                        ] as const).map((colors, i) => (
                            <TouchableOpacity key={i} style={[styles.themePreview, i === 0 && styles.themeActive]}>
                                <LinearGradient colors={colors} style={styles.themeGradient} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingTop: 60,
        paddingHorizontal: Spacing.lg,
    },
    backText: {
        ...Typography.body,
        color: Colors.textSecondary,
        fontSize: 15,
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
        fontSize: 24,
        marginTop: Spacing.md,
    },
    since: {
        ...Typography.caption,
        fontSize: 14,
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
        fontSize: 28,
        marginBottom: 4,
    },
    statLabel: {
        ...Typography.caption,
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 16,
    },
    statDivider: {
        width: 1,
        backgroundColor: Colors.white08,
    },
    sectionTitle: {
        ...Typography.bodySemiBold,
        fontSize: 17,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    milestonesCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        padding: Spacing.md,
    },
    milestoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    milestoneIcon: {
        fontSize: 24,
    },
    milestoneIconLocked: {
        opacity: 0.4,
    },
    milestoneInfo: {
        flex: 1,
    },
    milestoneName: {
        ...Typography.bodyMedium,
        fontSize: 15,
    },
    milestoneLocked: {
        color: Colors.textMuted,
    },
    milestoneDays: {
        ...Typography.caption,
        fontSize: 12,
    },
    milestoneCheck: {
        ...Typography.bodySemiBold,
        color: Colors.success,
        fontSize: 16,
    },
    themeRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        gap: Spacing.md,
    },
    themePreview: {
        width: 64,
        height: 64,
        borderRadius: Radius.md,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    themeActive: {
        borderColor: Colors.softPink,
    },
    themeGradient: {
        flex: 1,
    },
    bottomSpacer: {
        height: 40,
    },
});
