import GalaxySphere from '@/components/GalaxySphere';
import GlowButton from '@/components/GlowButton';
import GradientBackground from '@/components/GradientBackground';
import PremiumDatePicker from '@/components/PremiumDatePicker';
import StarBackground from '@/components/StarBackground';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { s } from '@/utils/scale';
import { useAppState } from '@/utils/store';
import { completeOnboarding as markOnboardingComplete, supabase, updateCoupleData } from '@/utils/supabase';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
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
type SetupStepType = 'relationship' | 'topics' | 'vibe';

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


export default function CoupleSetupScreen() {
    const router = useRouter();
    const { state, update } = useAppState();
    const [activeIndex, setActiveIndex] = useState(0);

    // Form state
    const [relationshipDate, setRelationshipDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [coupleVibe, setCoupleVibe] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Editor permission state
    const [isCheckingEditor, setIsCheckingEditor] = useState(true);
    const [isWaiting, setIsWaiting] = useState(false);

    // ─── Check & atomically claim editor role on mount ─
    useEffect(() => {
        let pollInterval: ReturnType<typeof setInterval> | null = null;

        const checkEditorPermission = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { setIsCheckingEditor(false); return; }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('couple_id')
                    .eq('id', user.id)
                    .single();

                if (!profile?.couple_id) {
                    setIsCheckingEditor(false);
                    return;
                }

                // ── Step 1: Try to atomically claim editor_user_id ──
                // This update only fires if editor_user_id IS NULL in the row,
                // so the first partner to arrive wins atomically.
                const { error: claimError } = await supabase
                    .from('couples')
                    .update({ editor_user_id: user.id })
                    .eq('id', profile.couple_id)
                    .is('editor_user_id', null); // only if unclaimed

                // ── Step 2: Read the actual value now ──
                const { data: couple } = await supabase
                    .from('couples')
                    .select('editor_user_id')
                    .eq('id', profile.couple_id)
                    .single();

                if (couple?.editor_user_id && couple.editor_user_id !== user.id) {
                    // Someone else claimed editor — show waiting screen
                    setIsWaiting(true);
                    setIsCheckingEditor(false);

                    // Poll until the editor has completed onboarding
                    pollInterval = setInterval(async () => {
                        try {
                            const { data: editorProfile } = await supabase
                                .from('profiles')
                                .select('onboarding_completed_at')
                                .eq('id', couple.editor_user_id)
                                .single();

                            if (editorProfile?.onboarding_completed_at) {
                                if (pollInterval) clearInterval(pollInterval);
                                // Mark this user's onboarding complete too
                                await supabase
                                    .from('profiles')
                                    .update({ onboarding_completed_at: new Date().toISOString() })
                                    .eq('id', user.id);
                                update({ hasCompletedOnboarding: true });
                                router.replace('/(main)/home');
                            }
                        } catch (e) {
                            console.error('Waiting poll error:', e);
                        }
                    }, 3000);
                    return;
                }

                // Current user is the editor (or just claimed it) — show form
                setIsCheckingEditor(false);
            } catch (e) {
                console.error('Editor check error:', e);
                setIsCheckingEditor(false);
            }
        };

        checkEditorPermission();

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, []);


    // Load existing data if available
    useEffect(() => {
        if (state.relationshipDate) {
            setRelationshipDate(new Date(state.relationshipDate));
        }
        if (state.topicPreferences.length > 0) {
            setSelectedTopics(state.topicPreferences);
        }
        if (state.coupleVibe) {
            setCoupleVibe(state.coupleVibe);
        }
    }, [state]);

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
            default: return true;
        }
    }, [currentStep.type, relationshipDate, selectedTopics, coupleVibe, loading]);

    // ─── Finalize Setup ───────────────────────────────
    const finishSetup = async () => {
        setLoading(true);
        try {
            const relDateStr = relationshipDate
                ? `${relationshipDate.getFullYear()}-${String(relationshipDate.getMonth() + 1).padStart(2, '0')}-${String(relationshipDate.getDate()).padStart(2, '0')}`
                : null;

            // 1. Update shared couple preferences (couples table)
            // NOTE: updateCoupleData also sets editor_user_id to this user
            await updateCoupleData({
                topic_preferences: selectedTopics,
                couple_vibe: coupleVibe,
                relationship_date: relDateStr,
            });

            // 2. Mark onboarding complete (profiles table)
            await markOnboardingComplete();

            // 3. Update local state
            update({
                topicPreferences: selectedTopics,
                coupleVibe: coupleVibe,
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
                                <PremiumDatePicker
                                    visible={showDatePicker}
                                    onClose={() => setShowDatePicker(false)}
                                    initialDate={relationshipDate || new Date()}
                                    maxDate={new Date()}
                                    title="Our Love Story Began"
                                    onDateSelected={(date) => {
                                        setRelationshipDate(date);
                                    }}
                                />
                            </>
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

            default:
                return null;
        }
    };

    // ─── Checking editor state ─────────────────────────
    if (isCheckingEditor) {
        return (
            <GradientBackground>
                <StarBackground />
                <View style={styles.waitingContainer}>
                    <Animated.View entering={FadeInUp.duration(600)} style={styles.waitingContent}>
                        <Text style={styles.waitingIcon}>🔄</Text>
                        <Text style={styles.waitingTitle}>Loading...</Text>
                    </Animated.View>
                </View>
            </GradientBackground>
        );
    }

    // ─── Waiting screen (partner is the editor) ────────
    if (isWaiting) {
        return (
            <GradientBackground>
                <StarBackground />
                <View style={styles.waitingContainer}>
                    <Animated.View entering={FadeInUp.duration(700)} style={styles.waitingContent}>
                        <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.waitingGalaxyWrapper}>
                            <GalaxySphere size={160} streakCount={1} />
                        </Animated.View>

                        <Animated.Text entering={FadeInUp.delay(200).duration(500)} style={styles.waitingTitle}>
                            {'Your partner is setting\nup your universe 💫'}
                        </Animated.Text>
                        <Animated.Text entering={FadeInUp.delay(350).duration(500)} style={styles.waitingSubtitle}>
                            {'Sit tight! We\'ll whisk you to your home\nscreen the moment they\'re done.'}
                        </Animated.Text>

                        <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.waitingDotsRow}>
                            {[0, 1, 2].map(i => (
                                <View key={i} style={[styles.waitingDot, { opacity: 0.4 + i * 0.2 }]} />
                            ))}
                        </Animated.View>
                    </Animated.View>
                </View>
            </GradientBackground>
        );
    }

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
    // ─── Waiting / Loading screens ────────────────────
    waitingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
    },
    waitingContent: {
        alignItems: 'center',
    },
    waitingGalaxyWrapper: {
        marginBottom: Spacing.xl,
    },
    waitingIcon: {
        fontSize: s(48),
        marginBottom: Spacing.lg,
    },
    waitingTitle: {
        ...Typography.heading,
        fontSize: s(24),
        textAlign: 'center',
        lineHeight: s(34),
        marginBottom: Spacing.md,
    },
    waitingSubtitle: {
        ...Typography.body,
        fontSize: s(14),
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: s(22),
        marginBottom: Spacing.xl,
    },
    waitingDotsRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    waitingDot: {
        width: s(8),
        height: s(8),
        borderRadius: s(4),
        backgroundColor: Colors.softPink,
    },
    // ─── Main Setup Screens ───────────────────────────
    container: {
        flex: 1,
        paddingTop: Spacing.xl,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
    },
    backButton: {
        width: s(36),
        height: s(36),
        borderRadius: s(18),
        backgroundColor: Colors.white08,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backPlaceholder: {
        width: s(36),
    },
    backArrow: {
        fontSize: s(24),
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
        fontSize: s(12),
        color: Colors.textMuted,
        width: s(36),
        textAlign: 'right',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: s(20),
    },
    fieldContent: {
        alignItems: 'center',
    },
    fieldTitle: {
        ...Typography.heading,
        fontSize: s(28),
        textAlign: 'center',
        lineHeight: s(38),
        marginBottom: Spacing.sm,
    },
    fieldSubtitle: {
        ...Typography.body,
        fontSize: s(14),
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: s(22),
    },
    bottomContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: s(40),
        alignItems: 'center',
    },
    nextButton: {
        width: '100%',
    },
    errorText: {
        ...Typography.bodyMedium,
        fontSize: s(13),
        color: Colors.danger,
        textAlign: 'center',
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.xl,
    },

    // ─── Date Picker ──────────────────────────────────
    dateContainer: {
        alignItems: 'center',
        marginTop: Spacing.lg,
        width: '100%',
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
        width: '100%',
        justifyContent: 'center',
    },
    dateIcon: {
        fontSize: s(24),
        marginRight: Spacing.sm,
    },
    dateText: {
        ...Typography.bodySemiBold,
        fontSize: s(16),
        color: Colors.textPrimary,
    },
    // New styles for @react-native-community/datetimepicker
    // The picker itself is typically rendered natively, so these styles might be for a wrapper or custom display
    datePickerDisplay: {
        width: '100%', // This might be for a custom display component that shows the selected date
        // Add other styles as needed for the display component
    },
    pickerWrapper: {
        backgroundColor: '#FFFFFF',
        borderRadius: Radius.lg,
        marginTop: Spacing.md,
        padding: Spacing.xs,
        width: '100%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        overflow: 'hidden',
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
        fontSize: s(16),
        marginRight: 6,
    },
    topicLabel: {
        ...Typography.bodyMedium,
        fontSize: s(13),
        color: Colors.textSecondary,
    },
    topicLabelSelected: {
        color: Colors.textPrimary,
    },
    topicCount: {
        ...Typography.caption,
        fontSize: s(13),
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
        fontSize: s(18),
        marginRight: 8,
    },
    chipLabel: {
        ...Typography.bodySemiBold,
        fontSize: s(14),
        color: Colors.textSecondary,
    },
    chipLabelSelected: {
        color: Colors.textPrimary,
    },

    reminderLabelSelected: {
        color: Colors.textSecondary,
    },
});
