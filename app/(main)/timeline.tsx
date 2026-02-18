import FloatingCard from '@/components/FloatingCard';
import GradientBackground from '@/components/GradientBackground';
import SkeletonLoader from '@/components/SkeletonLoader';
import StarBackground from '@/components/StarBackground';
import WeekCalendar from '@/components/WeekCalendar';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { QuestionService } from '@/utils/questionService';
import { s } from '@/utils/scale';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

interface TimelineEntry {
    id: string;
    date: string;
    question: string;
    category: string;
    myAnswer: string;
    partnerAnswer: string;
    partnerName: string;
}

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

function getWeekRange(date: Date): { start: string; end: string } {
    const day = date.getDay();
    const start = new Date(date);
    start.setDate(start.getDate() - day);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { start: fmt(start), end: fmt(end) };
}

// ─── Screen ───────────────────────────────────────────
export default function TimelineScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    // Cache: Map<date, TimelineEntry>
    const cacheRef = useRef<Map<string, TimelineEntry>>(new Map());
    const [markedDates, setMarkedDates] = useState<Set<string>>(new Set());
    const [selectedMemory, setSelectedMemory] = useState<TimelineEntry | null>(null);

    // Fetch week data and merge into cache
    const fetchWeekData = useCallback(async (weekStart: string, weekEnd: string) => {
        try {
            const data = await QuestionService.getTimelineForWeek(weekStart, weekEnd);
            data.forEach(entry => cacheRef.current.set(entry.date, entry));
            // Update marked dates
            setMarkedDates(new Set(cacheRef.current.keys()));
            // Update selected memory if it's in the new data
            setSelectedMemory(cacheRef.current.get(selectedDate) || null);
        } catch (err) {
            console.error('Timeline load error:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    // Load current week on mount
    useEffect(() => {
        const { start, end } = getWeekRange(new Date());
        fetchWeekData(start, end);
    }, []);

    // When day changes, read from cache (instant)
    const handleDateSelect = useCallback((date: string) => {
        setSelectedDate(date);
        setSelectedMemory(cacheRef.current.get(date) || null);
    }, []);

    // When week changes via swipe, fetch that week
    const handleWeekChange = useCallback((weekStart: string, weekEnd: string) => {
        fetchWeekData(weekStart, weekEnd);
    }, [fetchWeekData]);

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
                    onDateSelect={handleDateSelect}
                    onWeekChange={handleWeekChange}
                    markedDates={markedDates}
                />

                {/* Daily Content */}
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {loading ? (
                        <View style={{ gap: Spacing.md }}>
                            <SkeletonLoader.Line width={150} height={18} style={{ marginBottom: Spacing.md }} />
                            <SkeletonLoader.Card height={80} style={{ marginBottom: Spacing.md }} />
                            <SkeletonLoader.Card height={120} style={{ marginBottom: Spacing.md }} />
                            <SkeletonLoader.Card height={120} />
                        </View>
                    ) : selectedMemory ? (
                        <Animated.View entering={FadeInUp.duration(500)} key={selectedMemory.id}>
                            {/* Day badge */}
                            <View style={styles.dayRow}>
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
                                        <Text style={styles.answerLabel}>{selectedMemory.partnerName}'s Answer</Text>
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
        paddingTop: s(56),
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
        fontSize: s(18),
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: s(40),
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
        fontSize: s(12),
        color: Colors.goldSparkle,
        backgroundColor: 'rgba(245, 208, 138, 0.12)',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 999,
        overflow: 'hidden',
    },
    dateLabel: {
        ...Typography.caption,
        fontSize: s(13),
        color: Colors.textMuted,
    },

    // ─── Question ────────────────────────────────────
    question: {
        ...Typography.headingItalic,
        fontSize: s(18),
        lineHeight: s(26),
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
        fontSize: s(12),
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    answerText: {
        ...Typography.body,
        fontSize: s(15),
        color: Colors.textPrimary,
        lineHeight: s(22),
    },

    // ─── Empty State ─────────────────────────────────
    emptyState: {
        alignItems: 'center',
        marginTop: s(60),
    },
    emptyIcon: {
        fontSize: s(48),
        marginBottom: Spacing.md,
    },
    emptyTitle: {
        ...Typography.bodySemiBold,
        fontSize: s(16),
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    emptyText: {
        ...Typography.body,
        fontSize: s(14),
        color: Colors.textMuted,
        textAlign: 'center',
        lineHeight: s(20),
    },
});
