import GradientBackground from '@/components/GradientBackground';
import SkeletonLoader from '@/components/SkeletonLoader';
import StarBackground from '@/components/StarBackground';
import WeekCalendar from '@/components/WeekCalendar';
import { Colors, Spacing, Typography } from '@/constants/theme';
import {
    getAllEntries,
    getTodayDate,
    getWeekEntries,
    saveEntry
} from '@/utils/journalStore';
import { s } from '@/utils/scale';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// ─── Helpers ──────────────────────────────────────────
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
    const day = date.getDay(); // 0=Sun
    const start = new Date(date);
    start.setDate(start.getDate() - day);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { start: fmt(start), end: fmt(end) };
}

// ─── Main Screen ──────────────────────────────────────
export default function JournalScreen() {
    const router = useRouter();
    const today = getTodayDate();
    const [selectedDate, setSelectedDate] = useState(today);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [allDates, setAllDates] = useState<Set<string>>(new Set());
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Week cache: Map<date, content>
    const weekCacheRef = useRef<Map<string, string>>(new Map());

    const isToday = selectedDate === today;

    // Load all entry dates on mount (for dot indicators)
    useEffect(() => {
        (async () => {
            const all = await getAllEntries();
            setAllDates(new Set(all.map(e => e.date)));
        })();
    }, []);

    // Fetch current week's entries on mount
    useEffect(() => {
        const { start, end } = getWeekRange(new Date());
        fetchWeekData(start, end);
    }, []);

    // Fetch week data and populate cache
    const fetchWeekData = useCallback(async (weekStart: string, weekEnd: string) => {
        setLoading(true);
        try {
            const entries = await getWeekEntries(weekStart, weekEnd);
            const newCache = new Map<string, string>();
            entries.forEach(e => newCache.set(e.date, e.content));
            weekCacheRef.current = newCache;

            // If selected date is in this week, update content from cache
            if (weekCacheRef.current.has(selectedDate)) {
                setContent(weekCacheRef.current.get(selectedDate) || '');
            } else {
                setContent('');
            }
        } catch (err) {
            console.error('Failed to fetch week entries:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    // When day changes, read from cache (instant)
    const handleDateSelect = useCallback((date: string) => {
        setSelectedDate(date);
        const cached = weekCacheRef.current.get(date);
        setContent(cached ?? '');
        setSaveStatus('idle');
    }, []);

    // When week changes via swipe, fetch that week's data
    const handleWeekChange = useCallback((weekStart: string, weekEnd: string) => {
        fetchWeekData(weekStart, weekEnd);
    }, [fetchWeekData]);

    // Auto-save with 3s debounce
    const handleChange = useCallback(
        (text: string) => {
            setContent(text);
            // Update cache locally
            weekCacheRef.current.set(selectedDate, text);
            setSaveStatus('idle');
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
            if (savedTimeout.current) clearTimeout(savedTimeout.current);
            saveTimeout.current = setTimeout(async () => {
                setSaveStatus('saving');
                await saveEntry(selectedDate, text);
                // Update dots
                const all = await getAllEntries();
                setAllDates(new Set(all.map(e => e.date)));
                setSaveStatus('saved');
                savedTimeout.current = setTimeout(() => setSaveStatus('idle'), 2000);
            }, 2000);
        },
        [selectedDate],
    );

    // Save on blur immediately
    const handleBlur = useCallback(async () => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        if (savedTimeout.current) clearTimeout(savedTimeout.current);
        setSaveStatus('saving');
        await saveEntry(selectedDate, content);
        const all = await getAllEntries();
        setAllDates(new Set(all.map(e => e.date)));
        setSaveStatus('saved');
        savedTimeout.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }, [selectedDate, content]);

    return (
        <GradientBackground>
            <StarBackground />
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.container}>
                    {/* Header */}
                    <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={styles.backText}>← Back</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>📓 Journal</Text>
                        <View style={styles.placeholder} />
                    </Animated.View>

                    {/* Week Calendar */}
                    <WeekCalendar
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                        onWeekChange={handleWeekChange}
                        markedDates={allDates}
                    />

                    {/* Date label + Save indicator */}
                    <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.dateRow}>
                        <Text style={styles.dateLabel}>
                            {isToday ? '✨ Today' : formatDate(selectedDate)}
                        </Text>
                        {saveStatus === 'saving' && (
                            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
                                <Text style={styles.savingText}>Saving...</Text>
                            </Animated.View>
                        )}
                        {saveStatus === 'saved' && (
                            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
                                <Text style={styles.savedText}>✓ Saved</Text>
                            </Animated.View>
                        )}
                    </Animated.View>

                    {/* Direct text input — fills remaining space */}
                    <View style={styles.inputContainer}>
                        {loading ? (
                            <View style={{ gap: 12, marginTop: 10 }}>
                                <SkeletonLoader.Line width="90%" height={20} />
                                <SkeletonLoader.Line width="80%" height={20} />
                                <SkeletonLoader.Line width="95%" height={20} />
                                <SkeletonLoader.Line width="60%" height={20} />
                                <SkeletonLoader.Line width="85%" height={20} />
                            </View>
                        ) : (
                            <TextInput
                                style={styles.textInput}
                                value={content}
                                onChangeText={handleChange}
                                onBlur={handleBlur}
                                multiline
                                scrollEnabled
                                placeholder={
                                    isToday
                                        ? 'How are you feeling today?\nWrite your thoughts...'
                                        : 'Write your thoughts for this day...'
                                }
                                placeholderTextColor={Colors.textMuted}
                                textAlignVertical="top"
                            />
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: {
        flex: 1,
        paddingTop: Spacing.xs,
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
        fontSize: Typography.md.fontSize,
    },
    headerTitle: {
        ...Typography.heading,
        fontSize: Typography.xl.fontSize,
    },
    placeholder: { width: 50 },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    dateLabel: {
        ...Typography.bodySemiBold,
        fontSize: Typography.md.fontSize,
        color: Colors.goldSparkle,
    },
    savingText: {
        ...Typography.body,
        fontSize: Typography.sm.fontSize,
        color: Colors.textMuted,
        fontStyle: 'italic',
    },
    savedText: {
        ...Typography.bodySemiBold,
        fontSize: Typography.sm.fontSize,
        color: '#5CE05C',
    },
    inputContainer: {
        flexGrow: 1,
        paddingHorizontal: Spacing.lg,
        paddingBottom: s(40),
    },
    textInput: {
        ...Typography.body,
        fontSize: Typography.lg.fontSize,
        color: Colors.textPrimary,
        lineHeight: s(26),
        flex: 1,
        minHeight: s(200),
    },
});
