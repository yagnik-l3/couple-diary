import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { s } from '@/utils/scale';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PremiumDatePickerProps {
    visible: boolean;
    onClose: () => void;
    onDateSelected: (date: Date) => void;
    initialDate?: Date;
    maxDate?: Date;
    title?: string;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type PickerMode = 'calendar' | 'month' | 'year';

export default function PremiumDatePicker({
    visible,
    onClose,
    onDateSelected,
    initialDate = new Date(),
    maxDate,
    title = 'Select Date'
}: PremiumDatePickerProps) {
    const [viewDate, setViewDate] = useState(initialDate);
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [pickerMode, setPickerMode] = useState<PickerMode>('calendar');

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Reset internal state when visible changes to true
    useEffect(() => {
        if (visible) {
            setViewDate(initialDate);
            setSelectedDate(initialDate);
            setPickerMode('calendar');
        }
    }, [visible]);

    const daysInMonth = useMemo(() => {
        const date = new Date(year, month + 1, 0);
        return date.getDate();
    }, [year, month]);

    const firstDayOfMonth = useMemo(() => {
        return new Date(year, month, 1).getDay();
    }, [year, month]);

    const calendarDays = useMemo(() => {
        const days = [];
        // Fill empty slots for previous month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        // Fill days of the current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [year, month, daysInMonth, firstDayOfMonth]);

    const handleMonthChange = (direction: number) => {
        const newDate = new Date(year, month + direction, 1);
        if (maxDate && newDate > maxDate) return;
        setViewDate(newDate);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleDatePress = (date: Date) => {
        if (maxDate && date > maxDate) return;
        setSelectedDate(date);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handleConfirm = () => {
        onDateSelected(selectedDate);
        onClose();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const isSelected = (date: Date) => {
        return date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isDisabled = (date: Date) => {
        return maxDate ? date > maxDate : false;
    };

    // ─── Year Picker logic ────────────────────────────
    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 100;
        const endYear = currentYear + (maxDate ? 0 : 20);
        const y = [];
        for (let i = endYear; i >= startYear; i--) {
            y.push(i);
        }
        return y;
    }, [maxDate]);

    const handleYearSelect = (selectedYear: number) => {
        setViewDate(new Date(selectedYear, month, 1));
        setPickerMode('calendar');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleMonthSelect = (selectedMonth: number) => {
        setViewDate(new Date(year, selectedMonth, 1));
        setPickerMode('calendar');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade" // Use fade for Modal, remove Slide animations below
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                </Pressable>

                <View style={styles.container}>
                    <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>{title}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Top Navigation */}
                        <View style={styles.navRow}>
                            <View style={styles.selectorsRow}>
                                <TouchableOpacity
                                    onPress={() => setPickerMode(pickerMode === 'month' ? 'calendar' : 'month')}
                                    style={[styles.selectorBtn, pickerMode === 'month' && styles.selectorBtnActive]}
                                >
                                    <Text style={[styles.monthYearText, pickerMode === 'month' && styles.textActive]}>
                                        {MONTHS[month]}
                                    </Text>
                                    <Ionicons
                                        name={pickerMode === 'month' ? "chevron-up" : "chevron-down"}
                                        size={14}
                                        color={pickerMode === 'month' ? Colors.softPink : Colors.textSecondary}
                                        style={{ marginLeft: 4 }}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setPickerMode(pickerMode === 'year' ? 'calendar' : 'year')}
                                    style={[styles.selectorBtn, pickerMode === 'year' && styles.selectorBtnActive]}
                                >
                                    <Text style={[styles.monthYearText, pickerMode === 'year' && styles.textActive]}>
                                        {year}
                                    </Text>
                                    <Ionicons
                                        name={pickerMode === 'year' ? "chevron-up" : "chevron-down"}
                                        size={14}
                                        color={pickerMode === 'year' ? Colors.softPink : Colors.textSecondary}
                                        style={{ marginLeft: 4 }}
                                    />
                                </TouchableOpacity>
                            </View>

                            {pickerMode === 'calendar' && (
                                <View style={styles.monthNav}>
                                    <TouchableOpacity onPress={() => handleMonthChange(-1)} style={styles.navBtn}>
                                        <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleMonthChange(1)}
                                        style={[styles.navBtn, maxDate && new Date(year, month + 1, 1) > maxDate && { opacity: 0.3 }]}
                                        disabled={maxDate && new Date(year, month + 1, 1) > maxDate}
                                    >
                                        <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {pickerMode === 'year' ? (
                            <View style={[styles.gridContainer, styles.yearGrid]}>
                                <Animated.ScrollView
                                    entering={FadeIn}
                                    style={styles.scrollList}
                                    showsVerticalScrollIndicator={false}
                                >
                                    <View style={styles.gridInner}>
                                        {years.map((y) => (
                                            <TouchableOpacity
                                                key={y}
                                                style={[styles.gridItem, y === year && styles.gridItemActive]}
                                                onPress={() => handleYearSelect(y)}
                                            >
                                                <Text style={[styles.gridItemText, y === year && styles.gridItemTextActive]}>{y}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </Animated.ScrollView>
                            </View>
                        ) : pickerMode === 'month' ? (
                            <View style={[styles.gridContainer, styles.monthGrid]}>
                                <View style={styles.gridInner}>
                                    {MONTHS.map((m, idx) => (
                                        <TouchableOpacity
                                            key={m}
                                            style={[styles.gridItem, idx === month && styles.gridItemActive]}
                                            onPress={() => handleMonthSelect(idx)}
                                        >
                                            <Text style={[styles.gridItemText, idx === month && styles.gridItemTextActive]}>
                                                {m.substring(0, 3)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ) : (
                            <Animated.View entering={FadeIn} style={styles.calendarContainer}>
                                {/* Day Labels */}
                                <View style={styles.daysRow}>
                                    {DAYS_SHORT.map((d, i) => (
                                        <Text key={i} style={styles.dayLabel}>{d}</Text>
                                    ))}
                                </View>

                                {/* Calendar Grid */}
                                <View style={styles.grid}>
                                    {calendarDays.map((date, i) => (
                                        <View key={i} style={styles.cell}>
                                            {date ? (
                                                <TouchableOpacity
                                                    onPress={() => handleDatePress(date)}
                                                    disabled={isDisabled(date)}
                                                    style={[
                                                        styles.dateCircle,
                                                        isSelected(date) && styles.dateCircleSelected,
                                                        isToday(date) && !isSelected(date) && styles.dateCircleToday,
                                                        isDisabled(date) && styles.dateCircleDisabled
                                                    ]}
                                                >
                                                    <Text style={[
                                                        styles.dateText,
                                                        isSelected(date) && styles.dateTextSelected,
                                                        isDisabled(date) && styles.dateTextDisabled
                                                    ]}>
                                                        {date.getDate()}
                                                    </Text>
                                                </TouchableOpacity>
                                            ) : null}
                                        </View>
                                    ))}
                                </View>
                            </Animated.View>
                        )}

                        {/* Footer Action */}
                        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                            <Text style={styles.confirmBtnText}>Confirm Date</Text>
                        </TouchableOpacity>
                    </BlurView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    container: {
        width: SCREEN_WIDTH,
        borderTopLeftRadius: Radius.xxl,
        borderTopRightRadius: Radius.xxl,
        overflow: 'hidden',
        backgroundColor: 'rgba(20, 15, 40, 0.9)', // Slightly more solid since we're instant
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    blurContainer: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        ...Typography.h3,
        fontSize: s(18),
    },
    closeButton: {
        padding: 4,
    },
    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    selectorsRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    selectorBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectorBtnActive: {
        backgroundColor: 'rgba(199, 125, 184, 0.15)',
        borderColor: 'rgba(199, 125, 184, 0.3)',
    },
    monthYearText: {
        ...Typography.bodySemiBold,
        fontSize: s(15),
        color: Colors.textSecondary,
    },
    textActive: {
        color: Colors.softPink,
    },
    monthNav: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    navBtn: {
        width: s(36),
        height: s(36),
        borderRadius: Radius.full,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    calendarContainer: {
        minHeight: s(280),
    },
    daysRow: {
        flexDirection: 'row',
        marginBottom: Spacing.sm,
    },
    dayLabel: {
        flex: 1,
        textAlign: 'center',
        ...Typography.caption,
        color: Colors.textMuted,
        fontWeight: '700',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    cell: {
        width: `${100 / 7}%`,
        height: s(42),
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 2,
    },
    dateCircle: {
        width: s(34),
        height: s(34),
        borderRadius: Radius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateCircleSelected: {
        backgroundColor: Colors.softPink,
        shadowColor: Colors.softPink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    dateCircleToday: {
        borderWidth: 1,
        borderColor: 'rgba(199, 125, 184, 0.4)',
    },
    dateCircleDisabled: {
        opacity: 0.15,
    },
    dateText: {
        ...Typography.bodyMedium,
        fontSize: s(15),
        color: Colors.textPrimary,
    },
    dateTextSelected: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    dateTextDisabled: {
        color: Colors.textMuted,
    },
    confirmBtn: {
        backgroundColor: Colors.softPink,
        borderRadius: Radius.xl,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        marginTop: Spacing.lg,
    },
    confirmBtnText: {
        ...Typography.bodySemiBold,
        color: '#FFFFFF',
        fontSize: s(16),
    },
    gridContainer: {
        height: s(280),
    },
    scrollList: {
        flex: 1,
    },
    gridInner: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingVertical: Spacing.xs,
    },
    gridItem: {
        width: '23%',
        paddingVertical: s(18),
        alignItems: 'center',
        marginBottom: Spacing.sm,
        borderRadius: Radius.md,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    gridItemActive: {
        backgroundColor: `${Colors.softPink}22`,
        borderColor: Colors.softPink,
    },
    gridItemText: {
        ...Typography.bodyMedium,
        color: Colors.textSecondary,
    },
    gridItemTextActive: {
        color: Colors.softPink,
        fontWeight: '700',
    },
    yearGrid: {
        // specific for year if needed
    },
    monthGrid: {
        justifyContent: 'center',
    }
});
