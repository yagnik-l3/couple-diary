import GlowButton from '@/components/GlowButton';
import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { ms, vs } from '@/utils/scale';
import { useAppState } from '@/utils/store';
import { completeOnboarding as markOnboardingComplete, updateCoupleData, updateProfile } from '@/utils/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInUp,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

// ─── Step definitions ─────────────────────────────────
type SetupStepType = 'relationship' | 'topics' | 'vibe' | 'reminder';

interface SetupStep {
    id: string;
    type: SetupStepType;
    icon: string;
    title: string;
    subtitle: string;
}

const STEPS: SetupStep[] = [
    { id: 'relationship', type: 'relationship', icon: '💞', title: 'When did your\nlove story begin?', subtitle: 'We\'ll celebrate your milestones together' },
    { id: 'topics', type: 'topics', icon: '💬', title: 'Choose what you\nlove talking about', subtitle: 'Pick 3 or more — you can change this anytime' },
    { id: 'vibe', type: 'vibe', icon: '💫', title: 'Your Couple\nVibe', subtitle: 'How would you describe your relationship?' },
    { id: 'reminder', type: 'reminder', icon: '🔔', title: 'When should we\nremind you?', subtitle: 'A daily nudge so you never miss a question' },
];

const TOPIC_OPTIONS = [
    { id: 'love', label: 'Love Languages', icon: '💕' },
    { id: 'dreams', label: 'Dreams & Goals', icon: '🌠' },
    { id: 'intimacy', label: 'Intimacy', icon: '🔥' },
    { id: 'fun', label: 'Fun & Hypothetical', icon: '🎭' },
    { id: 'deep', label: 'Deep Conversations', icon: '🌊' },
    { id: 'memories', label: 'Past Memories', icon: '📸' },
    { id: 'future', label: 'Future Together', icon: '🚀' },
    { id: 'gratitude', label: 'Gratitude', icon: '🙏' },
    { id: 'chaos', label: 'Random Chaos', icon: '🎲' },
    { id: 'games', label: 'Couple Games', icon: '🎮' },
];

const VIBE_OPTIONS = [
    { id: 'romantic', label: 'Cute & Romantic', icon: '💞' },
    { id: 'funny', label: 'Funny & Meme-Lords', icon: '😂' },
    { id: 'deep', label: 'Deep & Emotional', icon: '🌊' },
    { id: 'chaotic', label: 'Chaotic but Loyal', icon: '🔥' },
    { id: 'calm', label: 'Calm & Peaceful', icon: '🌿' },
];

const REMINDER_OPTIONS = [
    { id: '09:00', label: 'Morning', time: '9 AM', icon: '☀️' },
    { id: '18:00', label: 'Evening', time: '6 PM', icon: '🌅' },
    { id: '22:00', label: 'Night', time: '10 PM', icon: '🌙' },
];

// ─── Animated Chip Component ──────────────────────────
function AnimatedChip({
    label, icon, selected, onPress, index,
}: { label: string; icon: string; selected: boolean; onPress: () => void; index: number }) {
    return (
        <Animated.View entering={FadeInUp.delay(index * 80 + 100).duration(400).springify()}>
            <TouchableOpacity
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
                activeOpacity={0.85}
            >
                <Text style={styles.chipIcon}>{icon}</Text>
                <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Topic Pill Component ─────────────────────────────
function TopicPill({
    label, icon, selected, onPress, index,
}: { label: string; icon: string; selected: boolean; onPress: () => void; index: number }) {
    return (
        <Animated.View entering={FadeInUp.delay(index * 60 + 80).duration(350).springify()}>
            <TouchableOpacity
                style={[styles.topicPill, selected && styles.topicPillSelected]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
                activeOpacity={0.85}
            >
                <Text style={styles.topicIcon}>{icon}</Text>
                <Text style={[styles.topicLabel, selected && styles.topicLabelSelected]}>{label}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Reminder Card Component ──────────────────────────
function ReminderCard({
    label, time, icon, selected, onPress, index,
}: { label: string; time: string; icon: string; selected: boolean; onPress: () => void; index: number }) {
    return (
        <Animated.View entering={FadeInUp.delay(index * 100 + 100).duration(400).springify()} style={{ flex: 1 }}>
            <TouchableOpacity
                style={[styles.reminderCard, selected && styles.reminderCardSelected]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
                activeOpacity={0.85}
            >
                <Text style={styles.reminderIcon}>{icon}</Text>
                <Text style={[styles.reminderTime, selected && styles.reminderTimeSelected]}>{time}</Text>
                <Text style={[styles.reminderLabel, selected && styles.reminderLabelSelected]}>{label}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function CoupleSetupScreen() {
    const router = useRouter();
    const { update } = useAppState();
    const [activeIndex, setActiveIndex] = useState(0);

    // Form state
    const [relationshipDate, setRelationshipDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [coupleVibe, setCoupleVibe] = useState('');
    const [reminderTime, setReminderTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const totalSteps = STEPS.length;
    const currentStep = STEPS[activeIndex];

    // ─── Animated Progress ────────────────────────────
    const progressWidth = useSharedValue(1 / totalSteps);

    useEffect(() => {
        progressWidth.value = withSpring((activeIndex + 1) / totalSteps, {
            damping: 15, stiffness: 120, mass: 0.8,
        });
    }, [activeIndex]);

    const progressAnimStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value * 100}%`,
    }));

    // ─── Validation ───────────────────────────────────
    const canProceed = useCallback((): boolean => {
        if (loading) return false;
        switch (currentStep.type) {
            case 'relationship': return relationshipDate !== null;
            case 'topics': return selectedTopics.length >= 3;
            case 'vibe': return coupleVibe !== '';
            case 'reminder': return reminderTime !== '';
            default: return true;
        }
    }, [currentStep.type, relationshipDate, selectedTopics, coupleVibe, reminderTime, loading]);

    // ─── Finalize Setup ───────────────────────────────
    const finishSetup = async () => {
        setLoading(true);
        try {
            const relDateStr = relationshipDate
                ? `${relationshipDate.getFullYear()}-${String(relationshipDate.getMonth() + 1).padStart(2, '0')}-${String(relationshipDate.getDate()).padStart(2, '0')}`
                : null;

            // 1. Update personal reminder time (profiles table)
            await updateProfile({
                reminder_time: reminderTime,
            });

            // 2. Update shared couple preferences (couples table)
            await updateCoupleData({
                topic_preferences: selectedTopics,
                couple_vibe: coupleVibe,
                relationship_date: relDateStr,
            });

            // 3. Mark onboarding complete (profiles table)
            await markOnboardingComplete();

            // 4. Update local state
            update({
                topicPreferences: selectedTopics,
                coupleVibe: coupleVibe,
                reminderTime: reminderTime,
                relationshipDate: relDateStr || '',
                hasCompletedOnboarding: true,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(main)/home');
        } catch (err: any) {
            setError(err.message || 'Failed to save preferences');
        } finally {
            setLoading(false);
        }
    };

    // ─── Navigation ───────────────────────────────────
    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Last step -> finish
        if (activeIndex === totalSteps - 1) {
            finishSetup();
            return;
        }

        setActiveIndex(activeIndex + 1);
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (activeIndex > 0) {
            setActiveIndex(activeIndex - 1);
        }
    };

    const toggleTopic = (id: string) => {
        setSelectedTopics(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    // ─── Render Content ───────────────────────────────
    const renderContent = () => {
        switch (currentStep.type) {
            case 'relationship':
                return (
                    <Animated.View key="relationship" entering={FadeInUp.duration(600)} exiting={FadeOut.duration(200)} style={styles.fieldContent}>
                        <Text style={styles.fieldTitle}>{currentStep.title}</Text>
                        <Text style={styles.fieldSubtitle}>{currentStep.subtitle}</Text>

                        <Animated.View entering={FadeInUp.delay(200).duration(400).springify()} style={styles.dateContainer}>
                            {Platform.OS === 'android' ? (
                                <>
                                    <TouchableOpacity
                                        onPress={() => setShowDatePicker(true)}
                                        style={styles.dateButton}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.dateIcon}>💞</Text>
                                        <Text style={styles.dateText}>
                                            {relationshipDate
                                                ? relationshipDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                                : 'Tap to select the date'}
                                        </Text>
                                    </TouchableOpacity>
                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={relationshipDate || new Date()}
                                            mode="date"
                                            display="spinner"
                                            maximumDate={new Date()}
                                            minimumDate={new Date(1970, 0, 1)}
                                            onChange={(event: any, selectedDate?: Date) => {
                                                setShowDatePicker(false);
                                                if (selectedDate) setRelationshipDate(selectedDate);
                                            }}
                                        />
                                    )}
                                </>
                            ) : (
                                <DateTimePicker
                                    value={relationshipDate || new Date()}
                                    mode="date"
                                    display="spinner"
                                    maximumDate={new Date()}
                                    minimumDate={new Date(1970, 0, 1)}
                                    onChange={(event: any, selectedDate?: Date) => {
                                        if (selectedDate) setRelationshipDate(selectedDate);
                                    }}
                                    themeVariant="dark"
                                    style={{ alignSelf: 'center' }}
                                />
                            )}
                        </Animated.View>
                    </Animated.View>
                );

            case 'topics':
                return (
                    <Animated.View key="topics" entering={FadeInUp.duration(600)} exiting={FadeOut.duration(200)} style={styles.fieldContent}>
                        <Text style={styles.fieldTitle}>{currentStep.title}</Text>
                        <Text style={styles.fieldSubtitle}>{currentStep.subtitle}</Text>
                        <View style={styles.topicGrid}>
                            {TOPIC_OPTIONS.map((topic, i) => (
                                <TopicPill
                                    key={topic.id}
                                    label={topic.label}
                                    icon={topic.icon}
                                    selected={selectedTopics.includes(topic.id)}
                                    onPress={() => toggleTopic(topic.id)}
                                    index={i}
                                />
                            ))}
                        </View>
                        <Animated.Text entering={FadeIn.delay(600).duration(300)} style={styles.topicCount}>
                            {selectedTopics.length} / 3 selected {selectedTopics.length >= 3 ? '✓' : ''}
                        </Animated.Text>
                    </Animated.View>
                );

            case 'vibe':
                return (
                    <Animated.View key="vibe" entering={FadeInUp.duration(600)} exiting={FadeOut.duration(200)} style={styles.fieldContent}>
                        <Text style={styles.fieldTitle}>{currentStep.title}</Text>
                        <Text style={styles.fieldSubtitle}>{currentStep.subtitle}</Text>
                        <View style={styles.chipGrid}>
                            {VIBE_OPTIONS.map((opt, i) => (
                                <AnimatedChip
                                    key={opt.id}
                                    label={opt.label}
                                    icon={opt.icon}
                                    selected={coupleVibe === opt.id}
                                    onPress={() => setCoupleVibe(opt.id)}
                                    index={i}
                                />
                            ))}
                        </View>
                    </Animated.View>
                );

            case 'reminder':
                return (
                    <Animated.View key="reminder" entering={FadeInUp.duration(600)} exiting={FadeOut.duration(200)} style={styles.fieldContent}>
                        <Text style={styles.fieldTitle}>{currentStep.title}</Text>
                        <Text style={styles.fieldSubtitle}>{currentStep.subtitle}</Text>
                        <View style={styles.reminderRow}>
                            {REMINDER_OPTIONS.map((opt, i) => (
                                <ReminderCard
                                    key={opt.id}
                                    label={opt.label}
                                    time={opt.time}
                                    icon={opt.icon}
                                    selected={reminderTime === opt.id}
                                    onPress={() => setReminderTime(opt.id)}
                                    index={i}
                                />
                            ))}
                        </View>
                    </Animated.View>
                );

            default:
                return null;
        }
    };

    return (
        <GradientBackground>
            <StarBackground />
            <View style={styles.container}>
                {/* Top bar */}
                <View style={styles.topBar}>
                    {activeIndex > 0 ? (
                        <Animated.View entering={FadeIn.duration(300)}>
                            <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
                                <Text style={styles.backArrow}>‹</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        <View style={styles.backPlaceholder} />
                    )}

                    <View style={styles.progressBar}>
                        <Animated.View style={[styles.progressFill, progressAnimStyle]} />
                    </View>

                    <Animated.Text entering={FadeIn.duration(300)} style={styles.stepIndicator}>
                        {activeIndex + 1} / {totalSteps}
                    </Animated.Text>
                </View>

                {/* Content */}
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {renderContent()}
                </ScrollView>

                {/* Error message */}
                {error ? (
                    <Animated.Text entering={FadeIn.duration(200)} style={styles.errorText}>
                        {error}
                    </Animated.Text>
                ) : null}

                {/* Bottom CTA */}
                <Animated.View
                    entering={FadeInUp.delay(400).duration(500)}
                    style={styles.bottomContainer}
                >
                    <GlowButton
                        title={activeIndex === totalSteps - 1 ? (loading ? 'Setting up...' : 'Start Journey ✨') : 'Next'}
                        onPress={handleNext}
                        disabled={!canProceed()}
                        loading={loading}
                        style={styles.nextButton}
                    />
                </Animated.View>
            </View>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: vs(60),
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
    },
    backButton: {
        width: ms(36),
        height: ms(36),
        borderRadius: ms(18),
        backgroundColor: Colors.white08,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backPlaceholder: {
        width: ms(36),
    },
    backArrow: {
        fontSize: ms(24),
        color: Colors.textPrimary,
        marginTop: -2,
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: Colors.white08,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.softPink,
        borderRadius: 2,
    },
    stepIndicator: {
        ...Typography.caption,
        fontSize: ms(12),
        color: Colors.textMuted,
        width: ms(36),
        textAlign: 'right',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: vs(20),
    },
    fieldContent: {
        alignItems: 'center',
    },
    fieldTitle: {
        ...Typography.heading,
        fontSize: ms(28),
        textAlign: 'center',
        lineHeight: ms(38),
        marginBottom: Spacing.sm,
    },
    fieldSubtitle: {
        ...Typography.body,
        fontSize: ms(14),
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: ms(22),
    },
    bottomContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: vs(40),
        alignItems: 'center',
    },
    nextButton: {
        width: '100%',
    },
    errorText: {
        ...Typography.bodyMedium,
        fontSize: ms(13),
        color: Colors.danger,
        textAlign: 'center',
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.xl,
    },

    // ─── Date Picker ──────────────────────────────────
    dateContainer: {
        alignItems: 'center',
        marginTop: Spacing.lg,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white08,
        borderRadius: Radius.md,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        minWidth: '80%',
        justifyContent: 'center',
    },
    dateIcon: {
        fontSize: ms(24),
        marginRight: Spacing.sm,
    },
    dateText: {
        ...Typography.bodySemiBold,
        fontSize: ms(16),
        color: Colors.textPrimary,
    },

    // ─── Topic Grid ───────────────────────────────────
    topicGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.sm,
        width: '100%',
    },
    topicPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.full,
        backgroundColor: Colors.white08,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    topicPillSelected: {
        backgroundColor: 'rgba(199, 125, 184, 0.2)',
        borderColor: Colors.softPink,
    },
    topicIcon: {
        fontSize: ms(16),
        marginRight: 6,
    },
    topicLabel: {
        ...Typography.bodyMedium,
        fontSize: ms(13),
        color: Colors.textSecondary,
    },
    topicLabelSelected: {
        color: Colors.textPrimary,
    },
    topicCount: {
        ...Typography.caption,
        fontSize: ms(13),
        color: Colors.textMuted,
        marginTop: Spacing.md,
    },

    // ─── Chip Grid ────────────────────────────────────
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.sm,
        width: '100%',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.md + 4,
        borderRadius: Radius.full,
        backgroundColor: Colors.white08,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipSelected: {
        backgroundColor: 'rgba(199, 125, 184, 0.2)',
        borderColor: Colors.softPink,
    },
    chipIcon: {
        fontSize: ms(18),
        marginRight: 8,
    },
    chipLabel: {
        ...Typography.bodySemiBold,
        fontSize: ms(14),
        color: Colors.textSecondary,
    },
    chipLabelSelected: {
        color: Colors.textPrimary,
    },

    // ─── Reminder ─────────────────────────────────────
    reminderRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.sm,
        width: '100%',
    },
    reminderCard: {
        alignItems: 'center',
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.sm,
        borderRadius: Radius.md,
        backgroundColor: Colors.white08,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    reminderCardSelected: {
        backgroundColor: 'rgba(199, 125, 184, 0.2)',
        borderColor: Colors.softPink,
    },
    reminderIcon: {
        fontSize: ms(28),
        marginBottom: Spacing.sm,
    },
    reminderTime: {
        ...Typography.bodySemiBold,
        fontSize: ms(16),
        color: Colors.textSecondary,
    },
    reminderTimeSelected: {
        color: Colors.textPrimary,
    },
    reminderLabel: {
        ...Typography.caption,
        fontSize: ms(12),
        color: Colors.textMuted,
    },
    reminderLabelSelected: {
        color: Colors.textSecondary,
    },
});
