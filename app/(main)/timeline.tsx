import FloatingCard from '@/components/FloatingCard';
import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import WeekCalendar from '@/components/WeekCalendar';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { ms, vs } from '@/utils/scale';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

// ─── Mock Data ────────────────────────────────────────
const MOCK_MEMORIES = [
    {
        id: '1',
        day: 12,
        date: '2026-02-12',
        question: "What's one small thing your partner does that always makes you smile?",
        myAnswer: "When they leave little notes around the house.",
        partnerAnswer: "The way they hum while cooking dinner.",
    },
    {
        id: '2',
        day: 11,
        date: '2026-02-11',
        question: "What moment from your first date do you remember most?",
        myAnswer: "The way the sunset reflected in your eyes.",
        partnerAnswer: "When we both ordered the same dish and laughed.",
    },
    {
        id: '3',
        day: 10,
        date: '2026-02-10',
        question: "If you could relive one day together, which would it be?",
        myAnswer: "Our road trip to the mountains last summer.",
        partnerAnswer: "The rainy day we spent cooking and dancing in the kitchen.",
    },
    {
        id: '4',
        day: 9,
        date: '2026-02-09',
        question: "What's a dream you want to achieve together?",
        myAnswer: "Travel the world and see the Northern Lights.",
        partnerAnswer: "Build a cozy home with a garden full of sunflowers.",
    },
    {
        id: '5',
        day: 8,
        date: '2026-02-08',
        question: "What song reminds you of your partner?",
        myAnswer: "Can't Help Falling In Love – Elvis",
        partnerAnswer: "Perfect – Ed Sheeran",
    },
];

// ─── Helper ───────────────────────────────────────────
function formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
}

// ─── Screen ───────────────────────────────────────────
export default function TimelineScreen() {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    const markedDates = useMemo(
        () => new Set(MOCK_MEMORIES.map(m => m.date)),
        [],
    );

    // Get the memory for the selected date
    const selectedMemory = useMemo(
        () => MOCK_MEMORIES.find(m => m.date === selectedDate),
        [selectedDate],
    );

    return (
        <GradientBackground>
            <StarBackground />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>📜 Timeline</Text>
                    <View style={{ width: 50 }} />
                </View>

                {/* Calendar */}
                <WeekCalendar
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    markedDates={markedDates}
                />

                {/* Daily Content */}
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {selectedMemory ? (
                        <Animated.View entering={FadeInUp.duration(500)} key={selectedMemory.id}>
                            {/* Day badge */}
                            <View style={styles.dayRow}>
                                <Text style={styles.dayBadge}>
                                    Day {selectedMemory.day}
                                </Text>
                                <Text style={styles.dateLabel}>
                                    {formatDate(selectedMemory.date)}
                                </Text>
                            </View>

                            {/* Question */}
                            <Text style={styles.question}>
                                "{selectedMemory.question}"
                            </Text>

                            {/* My answer */}
                            <Animated.View entering={FadeInUp.delay(100).duration(400)}>
                                <FloatingCard style={styles.answerCard}>
                                    <View style={styles.answerHeader}>
                                        <View style={[styles.dot, { backgroundColor: Colors.lavender }]} />
                                        <Text style={styles.answerLabel}>Your Answer</Text>
                                    </View>
                                    <Text style={styles.answerText}>{selectedMemory.myAnswer}</Text>
                                </FloatingCard>
                            </Animated.View>

                            {/* Partner answer */}
                            <Animated.View entering={FadeInUp.delay(200).duration(400)}>
                                <FloatingCard style={styles.answerCard}>
                                    <View style={styles.answerHeader}>
                                        <View style={[styles.dot, { backgroundColor: Colors.softPink }]} />
                                        <Text style={styles.answerLabel}>Partner's Answer</Text>
                                    </View>
                                    <Text style={styles.answerText}>{selectedMemory.partnerAnswer}</Text>
                                </FloatingCard>
                            </Animated.View>
                        </Animated.View>
                    ) : (
                        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>✨</Text>
                            <Text style={styles.emptyTitle}>No memory for this day</Text>
                            <Text style={styles.emptyText}>
                                Answer a daily question to create{'\n'}a memory for today
                            </Text>
                        </Animated.View>
                    )}
                </ScrollView>
            </View>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: {
        flex: 1,
        paddingTop: vs(56),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
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

    // ─── Day Info ────────────────────────────────────
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    dayBadge: {
        ...Typography.bodySemiBold,
        fontSize: ms(12),
        color: Colors.goldSparkle,
        backgroundColor: 'rgba(245, 208, 138, 0.12)',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 999,
        overflow: 'hidden',
    },
    dateLabel: {
        ...Typography.caption,
        fontSize: ms(13),
        color: Colors.textMuted,
    },

    // ─── Question ────────────────────────────────────
    question: {
        ...Typography.headingItalic,
        fontSize: ms(18),
        lineHeight: ms(26),
        color: Colors.textPrimary,
        marginBottom: Spacing.lg,
    },

    // ─── Answer Cards ────────────────────────────────
    answerCard: {
        marginBottom: Spacing.md,
    },
    answerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    answerLabel: {
        ...Typography.bodySemiBold,
        fontSize: ms(12),
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    answerText: {
        ...Typography.body,
        fontSize: ms(15),
        color: Colors.textPrimary,
        lineHeight: ms(22),
    },

    // ─── Empty State ─────────────────────────────────
    emptyState: {
        alignItems: 'center',
        marginTop: vs(60),
    },
    emptyIcon: {
        fontSize: ms(48),
        marginBottom: Spacing.md,
    },
    emptyTitle: {
        ...Typography.bodySemiBold,
        fontSize: ms(16),
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    emptyText: {
        ...Typography.body,
        fontSize: ms(14),
        color: Colors.textMuted,
        textAlign: 'center',
        lineHeight: ms(20),
    },
});
