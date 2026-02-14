import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import WeekCalendar from '@/components/WeekCalendar';
import { Colors, Spacing, Typography } from '@/constants/theme';
import {
    getAllEntries,
    getEntry,
    getTodayDate,
    saveEntry,
} from '@/utils/journalStore';
import { ms, vs } from '@/utils/scale';
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
import Animated, { FadeIn } from 'react-native-reanimated';

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

// ─── Main Screen ──────────────────────────────────────
export default function JournalScreen() {
    const router = useRouter();
    const today = getTodayDate();
    const [selectedDate, setSelectedDate] = useState(today);
    const [content, setContent] = useState('');
    const [allDates, setAllDates] = useState<Set<string>>(new Set());
    const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isToday = selectedDate === today;

    // Load all entry dates on mount
    useEffect(() => {
        (async () => {
            const all = await getAllEntries();
            setAllDates(new Set(all.map(e => e.date)));
        })();
    }, []);

    // Load content for selected date
    useEffect(() => {
        (async () => {
            const entry = await getEntry(selectedDate);
            setContent(entry?.content || '');
        })();
    }, [selectedDate]);

    // Auto-save with debounce
    const handleChange = useCallback(
        (text: string) => {
            setContent(text);
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
            saveTimeout.current = setTimeout(async () => {
                await saveEntry(selectedDate, text);
                // Update dots
                const all = await getAllEntries();
                setAllDates(new Set(all.map(e => e.date)));
            }, 800);
        },
        [selectedDate],
    );

    // Save on blur immediately
    const handleBlur = useCallback(async () => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        await saveEntry(selectedDate, content);
        const all = await getAllEntries();
        setAllDates(new Set(all.map(e => e.date)));
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
                        onDateSelect={setSelectedDate}
                        markedDates={allDates}
                    />

                    {/* Date label */}
                    <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.dateRow}>
                        <Text style={styles.dateLabel}>
                            {isToday ? '✨ Today' : formatDate(selectedDate)}
                        </Text>
                    </Animated.View>

                    {/* Direct text input — fills remaining space */}
                    <View style={styles.inputContainer}>
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
        ...Typography.heading,
        fontSize: ms(20),
    },
    placeholder: { width: 50 },
    dateRow: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    dateLabel: {
        ...Typography.bodySemiBold,
        fontSize: ms(14),
        color: Colors.goldSparkle,
    },
    inputContainer: {
        flexGrow: 1,
        paddingHorizontal: Spacing.lg,
        paddingBottom: vs(40),
    },
    textInput: {
        ...Typography.body,
        fontSize: ms(16),
        color: Colors.textPrimary,
        lineHeight: ms(26),
        flex: 1,
        minHeight: vs(200),
    },
});
