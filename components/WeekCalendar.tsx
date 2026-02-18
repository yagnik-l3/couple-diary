import { Colors, Spacing, Typography } from '@/constants/theme';
import { s } from '@/utils/scale';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

// ─── Helpers ──────────────────────────────────────────
const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMonthLabel(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Generate an array of Date objects for the week containing `center`. */
function getWeekDays(center: Date): Date[] {
    const day = center.getDay(); // 0=Sun
    const start = new Date(center);
    start.setDate(start.getDate() - day);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        days.push(d);
    }
    return days;
}

/** Generate weeks: current week ± `range` weeks. */
function generateWeeks(centerDate: Date, range = 26): Date[][] {
    const weeks: Date[][] = [];
    for (let i = -range; i <= range; i++) {
        const d = new Date(centerDate);
        d.setDate(d.getDate() + i * 7);
        weeks.push(getWeekDays(d));
    }
    return weeks;
}

// ─── Props ────────────────────────────────────────────
interface WeekCalendarProps {
    selectedDate: string;               // YYYY-MM-DD
    onDateSelect: (date: string) => void;
    onWeekChange?: (weekStart: string, weekEnd: string) => void;
    markedDates?: Set<string>;          // dates with a dot indicator
}

// ─── Component ────────────────────────────────────────
export default function WeekCalendar({
    selectedDate,
    onDateSelect,
    onWeekChange,
    markedDates,
}: WeekCalendarProps) {
    const todayStr = toDateStr(new Date());
    const [weeks] = useState(() => generateWeeks(new Date()));
    const [visibleMonth, setVisibleMonth] = useState(getMonthLabel(new Date()));
    const flatListRef = useRef<FlatList>(null);
    const initialIndex = Math.floor(weeks.length / 2); // center = current week

    // Scroll to current week on mount
    useEffect(() => {
        setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
        }, 100);
    }, []);

    const handleDayPress = useCallback(
        (dateStr: string) => {
            Haptics.selectionAsync();
            onDateSelect(dateStr);
        },
        [onDateSelect],
    );

    const lastWeekKeyRef = useRef<string>('');

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            const middleWeek = viewableItems[Math.floor(viewableItems.length / 2)];
            if (middleWeek?.item) {
                const days = middleWeek.item as Date[];
                // Use the middle day of the week for the month label
                const midDay = days[3];
                setVisibleMonth(getMonthLabel(midDay));

                // Notify parent about week change
                if (onWeekChange) {
                    const weekStart = toDateStr(days[0]);
                    const weekEnd = toDateStr(days[6]);
                    const weekKey = `${weekStart}_${weekEnd}`;
                    if (weekKey !== lastWeekKeyRef.current) {
                        lastWeekKeyRef.current = weekKey;
                        onWeekChange(weekStart, weekEnd);
                    }
                }
            }
        }
    }).current;

    const renderWeek = useCallback(
        ({ item: days }: { item: Date[] }) => (
            <View style={styles.weekRow}>
                {days.map((day) => {
                    const dateStr = toDateStr(day);
                    const isSelected = dateStr === selectedDate;
                    const isToday = dateStr === todayStr;
                    const hasEntry = markedDates?.has(dateStr);

                    return (
                        <TouchableOpacity
                            key={dateStr}
                            style={styles.dayColumn}
                            onPress={() => handleDayPress(dateStr)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.dayName}>
                                {DAY_NAMES[day.getDay()]}
                            </Text>
                            <View
                                style={[
                                    styles.dayCircle,
                                    isSelected && styles.dayCircleSelected,
                                    isToday && !isSelected && styles.dayCircleToday,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.dayNumber,
                                        isSelected && styles.dayNumberSelected,
                                        isToday && !isSelected && styles.dayNumberToday,
                                    ]}
                                >
                                    {day.getDate()}
                                </Text>
                            </View>
                            {hasEntry && (
                                <View style={[
                                    styles.dotIndicator,
                                    isSelected && styles.dotIndicatorSelected,
                                ]} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        ),
        [selectedDate, todayStr, markedDates, handleDayPress],
    );

    return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
            {/* Month label */}
            <View style={styles.monthRow}>
                <Text style={styles.monthLabel}>{visibleMonth}</Text>
            </View>

            {/* Horizontal paging week strip */}
            <FlatList
                ref={flatListRef}
                data={weeks}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => String(i)}
                renderItem={renderWeek}
                getItemLayout={(_, index) => ({
                    length: WEEK_WIDTH,
                    offset: WEEK_WIDTH * index,
                    index,
                })}
                initialScrollIndex={initialIndex}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            />
        </Animated.View>
    );
}

// We use screen width via Dimensions as the week width for paging
import { Dimensions } from 'react-native';
const WEEK_WIDTH = Dimensions.get('window').width;
const DAY_SIZE = s(36);

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    monthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    monthLabel: {
        ...Typography.bodySemiBold,
        fontSize: s(14),
        color: Colors.textSecondary,
    },
    weekRow: {
        width: WEEK_WIDTH,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: Spacing.md,
    },
    dayColumn: {
        alignItems: 'center',
        gap: 4,
        minWidth: DAY_SIZE + 8,
    },
    dayName: {
        ...Typography.caption,
        fontSize: s(11),
        color: Colors.textMuted,
        marginBottom: 2,
    },
    dayCircle: {
        width: DAY_SIZE,
        height: DAY_SIZE,
        borderRadius: 999, // Use 999 for perfect circle on Android
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden', // Ensure background doesn't bleed if any
    },
    dayCircleSelected: {
        backgroundColor: Colors.softPink,
    },
    dayCircleToday: {
        borderWidth: 1.5,
        borderColor: Colors.lavender,
    },
    dayNumber: {
        ...Typography.bodyMedium,
        fontSize: s(14),
        color: Colors.textSecondary,
    },
    dayNumberSelected: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    dayNumberToday: {
        color: Colors.lavender,
    },
    dotIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.softPink,
        marginTop: -2,
    },
    dotIndicatorSelected: {
        backgroundColor: '#FFFFFF',
    },
});
