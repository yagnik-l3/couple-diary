import AvatarMerge from '@/components/AvatarMerge';
import FloatingCard from '@/components/FloatingCard';
import GlowButton from '@/components/GlowButton';
import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { ms, vs } from '@/utils/scale';
import { useAppState } from '@/utils/store';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    FadeInUp,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';



// ─── Step definitions ─────────────────────────────────
type StepType = 'intro' | 'email' | 'otp' | 'name' | 'gender' | 'topics' | 'invite';

interface Step {
    id: string;
    type: StepType;
    icon?: string;
    title: string;
    subtitle?: string;
}

const STEPS: Step[] = [
    { id: 'welcome', type: 'intro', icon: '⭐', title: 'A Universe\nFor Two', subtitle: 'Begin a journey of connection,\none question at a time.' },
    { id: 'daily', type: 'intro', icon: '💬', title: 'Answer One\nQuestion Every Day', subtitle: 'Thoughtful questions designed\nto deepen your bond.' },
    { id: 'galaxy', type: 'intro', icon: '🌌', title: 'Watch Your\nUniverse Expand', subtitle: 'Every day you answer together,\nyour galaxy grows.' },
    { id: 'email', type: 'email', title: 'What\'s your\nemail?', subtitle: 'We\'ll send you a code to get started' },
    { id: 'otp', type: 'otp', title: 'Enter the code', subtitle: 'Check your inbox for the magic code ✨' },
    { id: 'name', type: 'name', title: 'What should we\ncall you?', subtitle: 'Your partner will see this name' },
    { id: 'gender', type: 'gender', title: 'Tell us about\nyourself', subtitle: 'This helps personalize your questions' },
    { id: 'topics', type: 'topics', title: 'What do you want\nto explore?', subtitle: 'Choose 3 or more topics for your daily questions' },
    { id: 'invite', type: 'invite', title: 'Invite Your\nPartner', subtitle: 'Share your code or join theirs' },
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
];

const GENDER_OPTIONS = [
    { id: 'male', label: 'Male', icon: '👨' },
    { id: 'female', label: 'Female', icon: '👩' },
    { id: 'non-binary', label: 'Non-Binary', icon: '🧑' },
    { id: 'prefer-not', label: 'Prefer Not to Say', icon: '✨' },
];

// ─── Animated Chip Component ──────────────────────────
function AnimatedChip({
    label, icon, selected, onPress, index,
}: { label: string; icon: string; selected: boolean; onPress: () => void; index: number }) {

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    return (
        <Animated.View
            entering={FadeInUp.delay(index * 80 + 100).duration(400).springify()}
        >
            <TouchableOpacity
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={handlePress}
                activeOpacity={0.85}
            >
                <Text style={styles.chipIcon}>{icon}</Text>
                <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
                {selected && (
                    <Animated.Text entering={FadeIn.duration(200)} style={styles.chipCheck}>✓</Animated.Text>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Animated Topic Pill Component ────────────────────
function AnimatedTopicPill({
    label, icon, selected, onPress, index,
}: { label: string; icon: string; selected: boolean; onPress: () => void; index: number }) {

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    return (
        <Animated.View
            entering={FadeInUp.delay(index * 60 + 80).duration(350).springify()}
        >
            <TouchableOpacity
                style={[styles.topicPill, selected && styles.topicPillSelected]}
                onPress={handlePress}
                activeOpacity={0.85}
            >
                <Text style={styles.topicIcon}>{icon}</Text>
                <Text style={[styles.topicLabel, selected && styles.topicLabelSelected]}>
                    {label}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Pulsing Icon Component ───────────────────────────
function PulsingIcon({ icon }: { icon: string }) {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withRepeat(
            withSequence(
                withTiming(1.12, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
            false,
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.Text style={[styles.introIcon, animStyle]}>{icon}</Animated.Text>
    );
}

export default function OnboardingScreen() {
    const router = useRouter();
    const { update } = useAppState();
    const [activeIndex, setActiveIndex] = useState(0);

    // Form state
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [name, setName] = useState('');
    const [gender, setGender] = useState('');
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [inviteCode, setInviteCode] = useState('');
    const [codeError, setCodeError] = useState('');
    const [codeCopied, setCodeCopied] = useState(false);

    const otpRefs = useRef<(TextInput | null)[]>([]);
    const mockInviteCode = 'LOVE-2024-STARS';

    const currentStep = STEPS[activeIndex];
    const totalSteps = STEPS.length;

    // ─── Animated Progress ────────────────────────────
    const progressWidth = useSharedValue(1 / totalSteps);

    useEffect(() => {
        progressWidth.value = withSpring((activeIndex + 1) / totalSteps, {
            damping: 15,
            stiffness: 120,
            mass: 0.8,
        });
    }, [activeIndex]);

    const progressAnimStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value * 100}%`,
    }));

    // ─── Validation ───────────────────────────────────
    const canProceed = useCallback((): boolean => {
        switch (currentStep.type) {
            case 'intro': return true;
            case 'email': return email.includes('@') && email.includes('.');
            case 'otp': return otp.every(d => d !== '');
            case 'name': return name.trim().length >= 2;
            case 'gender': return gender !== '';
            case 'topics': return selectedTopics.length >= 3;
            case 'invite': return true;
            default: return true;
        }
    }, [currentStep.type, email, otp, name, gender, selectedTopics]);

    // ─── Navigation ───────────────────────────────────
    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // On invite step: validate partner code if entered
        if (currentStep.type === 'invite' && inviteCode.trim().length > 0) {
            if (inviteCode.trim().length < 8) {
                setCodeError('Code must be at least 8 characters');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                return;
            }
            setCodeError('');
            // Code is valid → navigate to standalone connected screen
            router.replace({
                pathname: '/connected',
                params: {
                    name,
                    email,
                    gender,
                    topics: selectedTopics.join(','),
                    inviteCode: inviteCode.trim(),
                },
            });
            return;
        }

        if (currentStep.type === 'invite' && inviteCode.trim().length === 0) {
            // No code entered → finish onboarding without partner
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            update({
                userEmail: email,
                userName: name,
                userGender: gender as any,
                topicPreferences: selectedTopics,
                hasCompletedOnboarding: true,
                hasPartner: false,
            });
            router.replace('/(main)/home');
            return;
        }

        if (activeIndex < totalSteps - 1) {
            setActiveIndex(activeIndex + 1);
        }
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (activeIndex > 0) {
            setActiveIndex(activeIndex - 1);
        }
    };

    const handleShare = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            await Share.share({
                message: `Join me on Couple Diary! Use my invite code: ${mockInviteCode} ✨💫`,
            });
        } catch { }
    };

    const handleCopyCode = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await Clipboard.setStringAsync(mockInviteCode);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    };

    // ─── OTP Input Handler ────────────────────────────
    const handleOtpChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);
        if (text) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (index < 3) {
                otpRefs.current[index + 1]?.focus();
            }
            // Check if all OTP fields are filled
            if (index === 3 && newOtp.every(d => d !== '')) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        }
    };

    // ─── Topic Toggle ─────────────────────────────────
    const toggleTopic = (id: string) => {
        setSelectedTopics(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    // ─── Button Label ─────────────────────────────────
    const getButtonLabel = (): string => {
        if (currentStep.type === 'invite') {
            return inviteCode.trim().length > 0 ? 'Connect Partner' : 'Start Without Partner';
        }
        if (currentStep.type === 'intro') return 'Continue';
        return 'Next';
    };

    // ─── Render Step Content ──────────────────────────
    const renderContent = () => {
        switch (currentStep.type) {
            case 'intro':
                return (
                    <Animated.View key={currentStep.id} entering={FadeInUp.duration(600)} exiting={FadeOut.duration(200)} style={styles.introContent}>
                        <PulsingIcon icon={currentStep.icon!} />
                        <Animated.Text
                            entering={FadeInUp.delay(150).duration(500)}
                            style={styles.introTitle}
                        >
                            {currentStep.title}
                        </Animated.Text>
                        <Animated.Text
                            entering={FadeInUp.delay(300).duration(500)}
                            style={styles.introSubtitle}
                        >
                            {currentStep.subtitle}
                        </Animated.Text>
                    </Animated.View>
                );

            case 'email':
                return (
                    <Animated.View key="email" entering={FadeInUp.duration(600)} exiting={FadeOut.duration(200)} style={styles.fieldContent}>
                        <Text style={styles.fieldTitle}>{currentStep.title}</Text>
                        <Text style={styles.fieldSubtitle}>{currentStep.subtitle}</Text>
                        <Animated.View entering={FadeInUp.delay(200).duration(400).springify()} style={styles.inputWrapper}>
                            <Text style={styles.inputIcon}>✉️</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="your@email.com"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoFocus
                            />
                        </Animated.View>
                    </Animated.View>
                );

            case 'otp':
                return (
                    <Animated.View key="otp" entering={FadeInUp.duration(600)} exiting={FadeOut.duration(200)} style={styles.fieldContent}>
                        <Text style={styles.fieldTitle}>{currentStep.title}</Text>
                        <Text style={styles.fieldSubtitle}>{currentStep.subtitle}</Text>
                        <View style={styles.otpRow}>
                            {otp.map((digit, i) => (
                                <Animated.View
                                    key={i}
                                    entering={FadeInDown.delay(i * 100 + 150).duration(400).springify()}
                                >
                                    <TextInput
                                        ref={ref => { otpRefs.current[i] = ref; }}
                                        style={[styles.otpInput, digit ? styles.otpFilled : null]}
                                        value={digit}
                                        onChangeText={text => handleOtpChange(text, i)}
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        textAlign="center"
                                        autoFocus={i === 0}
                                    />
                                </Animated.View>
                            ))}
                        </View>
                        <Animated.View entering={FadeIn.delay(600).duration(400)}>
                            <TouchableOpacity>
                                <Text style={styles.resendText}>Didn't get the code? Resend</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </Animated.View>
                );

            case 'name':
                return (
                    <Animated.View key="name" entering={FadeInUp.duration(600)} exiting={FadeOut.duration(200)} style={styles.fieldContent}>
                        <Text style={styles.fieldTitle}>{currentStep.title}</Text>
                        <Text style={styles.fieldSubtitle}>{currentStep.subtitle}</Text>
                        <Animated.View entering={FadeInUp.delay(200).duration(400).springify()} style={styles.inputWrapper}>
                            <Text style={styles.inputIcon}>✨</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Your name"
                                placeholderTextColor={Colors.textMuted}
                                autoFocus
                            />
                        </Animated.View>
                    </Animated.View>
                );

            case 'gender':
                return (
                    <Animated.View key="gender" entering={FadeInUp.duration(600)} exiting={FadeOut.duration(200)} style={styles.fieldContent}>
                        <Text style={styles.fieldTitle}>{currentStep.title}</Text>
                        <Text style={styles.fieldSubtitle}>{currentStep.subtitle}</Text>
                        <View style={styles.chipGrid}>
                            {GENDER_OPTIONS.map((opt, i) => (
                                <AnimatedChip
                                    key={opt.id}
                                    label={opt.label}
                                    icon={opt.icon}
                                    selected={gender === opt.id}
                                    onPress={() => setGender(opt.id)}
                                    index={i}
                                />
                            ))}
                        </View>
                    </Animated.View>
                );

            case 'topics':
                return (
                    <Animated.View key="topics" entering={FadeInUp.duration(600)} exiting={FadeOut.duration(200)} style={styles.fieldContent}>
                        <Text style={styles.fieldTitle}>{currentStep.title}</Text>
                        <Text style={styles.fieldSubtitle}>{currentStep.subtitle}</Text>
                        <View style={styles.topicGrid}>
                            {TOPIC_OPTIONS.map((topic, i) => (
                                <AnimatedTopicPill
                                    key={topic.id}
                                    label={topic.label}
                                    icon={topic.icon}
                                    selected={selectedTopics.includes(topic.id)}
                                    onPress={() => toggleTopic(topic.id)}
                                    index={i}
                                />
                            ))}
                        </View>
                        <Animated.Text
                            entering={FadeIn.delay(600).duration(300)}
                            style={styles.topicCount}
                        >
                            {selectedTopics.length} / 3 selected {selectedTopics.length >= 3 ? '✓' : ''}
                        </Animated.Text>
                    </Animated.View>
                );

            case 'invite':
                return (
                    <Animated.View key="invite" entering={FadeInUp.duration(600)} exiting={FadeOut.duration(200)} style={styles.fieldContent}>
                        <Animated.View entering={FadeIn.delay(100).duration(500)}>
                            <AvatarMerge size={ms(60)} />
                        </Animated.View>
                        <Text style={[styles.fieldTitle, { marginTop: Spacing.lg }]}>{currentStep.title}</Text>
                        <Text style={styles.fieldSubtitle}>{currentStep.subtitle}</Text>

                        <Animated.View entering={FadeInUp.delay(200).duration(400).springify()} style={{ width: '100%' }}>
                            <FloatingCard style={styles.inviteCard}>
                                <Text style={styles.inviteLabel}>Have your partner's code?</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={[styles.input, { textAlign: 'center', letterSpacing: 3 }]}
                                        value={inviteCode}
                                        onChangeText={(t) => { setInviteCode(t); setCodeError(''); }}
                                        placeholder="XXXX-XXXX-XXXX"
                                        placeholderTextColor={Colors.textMuted}
                                        autoCapitalize="characters"
                                    />
                                </View>
                                {codeError ? (
                                    <Animated.Text entering={FadeIn.duration(200)} style={styles.codeErrorText}>
                                        {codeError}
                                    </Animated.Text>
                                ) : null}
                            </FloatingCard>
                        </Animated.View>

                        <Animated.View entering={FadeIn.delay(400).duration(300)} style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or share yours</Text>
                            <View style={styles.dividerLine} />
                        </Animated.View>

                        <TouchableOpacity
                            onPress={handleCopyCode}
                            activeOpacity={0.7}
                            style={{ width: '100%' }}
                        >
                            <Animated.View entering={FadeInUp.delay(500).duration(400).springify()} style={styles.shareCodeBox}>
                                <Text style={styles.shareCode}>{mockInviteCode}</Text>
                                <Text style={styles.copyHint}>
                                    {codeCopied ? '✓ Copied!' : 'Tap to copy'}
                                </Text>
                            </Animated.View>
                        </TouchableOpacity>

                        {/* <Animated.View entering={FadeInUp.delay(600).duration(400)} style={styles.shareRow}>
                            <TouchableOpacity onPress={handleShare} style={styles.shareLink}>
                                <Text style={styles.shareLinkText}>🔗 Share with partner</Text>
                            </TouchableOpacity>
                        </Animated.View> */}
                    </Animated.View>
                );



            default:
                return null;
        }
    };

    return (
        <GradientBackground>
            <StarBackground />
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={styles.container}>
                    {/* Top bar: back button + progress */}
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

                        {activeIndex >= 3 ? (
                            <Animated.Text entering={FadeIn.duration(300)} style={styles.stepIndicator}>
                                {activeIndex - 2} / {totalSteps - 3}
                            </Animated.Text>
                        ) : (
                            <View style={styles.stepPlaceholder} />
                        )}
                    </View>

                    {/* Content — ScrollView enables scrolling when keyboard is open */}
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        {renderContent()}
                    </ScrollView>

                    {/* Bottom CTA */}
                    <Animated.View
                        entering={FadeInDown.delay(400).duration(500)}
                        style={styles.bottomContainer}
                    >
                        <GlowButton
                            title={getButtonLabel()}
                            onPress={handleNext}
                            disabled={!canProceed()}
                            style={styles.nextButton}
                        />
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: {
        flex: 1,
        paddingTop: vs(60),
    },

    // ─── Top bar ──────────────────────────────────────
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.white08,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backArrow: {
        fontSize: ms(24),
        color: Colors.textPrimary,
        marginTop: -2,
    },
    backPlaceholder: {
        width: 36,
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
        fontSize: ms(11),
        color: Colors.textMuted,
        minWidth: 36,
        textAlign: 'right',
    },
    stepPlaceholder: {
        width: 36,
    },

    // ─── Content ──────────────────────────────────────
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
    },
    bottomContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: vs(40),
        alignItems: 'center',
    },
    nextButton: {
        width: '100%',
    },

    // ─── Intro slides ─────────────────────────────────
    introContent: {
        alignItems: 'center',
    },
    introIcon: {
        fontSize: ms(72),
        marginBottom: Spacing.xl,
    },
    introTitle: {
        ...Typography.heading,
        fontSize: ms(34),
        textAlign: 'center',
        lineHeight: ms(44),
        marginBottom: Spacing.lg,
    },
    introSubtitle: {
        ...Typography.body,
        fontSize: ms(16),
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: ms(24),
    },

    // ─── Field screens ────────────────────────────────
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
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.inputBg,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.inputBorder,
        paddingHorizontal: Spacing.md,
        width: '100%',
    },
    inputIcon: {
        fontSize: ms(18),
        marginRight: Spacing.sm,
    },
    input: {
        flex: 1,
        ...Typography.body,
        fontSize: ms(16),
        color: Colors.textPrimary,
        paddingVertical: Spacing.md,
    },

    // ─── OTP ──────────────────────────────────────────
    otpRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    otpInput: {
        width: ms(56),
        height: ms(64),
        borderRadius: Radius.md,
        borderWidth: 1.5,
        borderColor: Colors.inputBorder,
        backgroundColor: Colors.inputBg,
        ...Typography.heading,
        fontSize: ms(28),
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    otpFilled: {
        borderColor: Colors.softPink,
        backgroundColor: 'rgba(199, 125, 184, 0.08)',
    },
    resendText: {
        ...Typography.bodyMedium,
        fontSize: ms(13),
        color: Colors.softPink,
    },

    // ─── Gender chips ─────────────────────────────────
    chipGrid: {
        width: '100%',
        gap: Spacing.sm,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.inputBg,
        borderRadius: Radius.lg,
        borderWidth: 1.5,
        borderColor: Colors.inputBorder,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.md,
    },
    chipSelected: {
        borderColor: Colors.softPink,
        backgroundColor: 'rgba(199, 125, 184, 0.1)',
    },
    chipIcon: {
        fontSize: ms(24),
    },
    chipLabel: {
        ...Typography.bodyMedium,
        fontSize: ms(16),
        color: Colors.textSecondary,
        flex: 1,
    },
    chipLabelSelected: {
        color: Colors.textPrimary,
    },
    chipCheck: {
        fontSize: ms(16),
        color: Colors.softPink,
    },

    // ─── Topics ───────────────────────────────────────
    topicGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    topicPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.inputBg,
        borderRadius: Radius.full,
        borderWidth: 1.5,
        borderColor: Colors.inputBorder,
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.md,
        gap: Spacing.xs + 2,
    },
    topicPillSelected: {
        borderColor: Colors.softPink,
        backgroundColor: 'rgba(199, 125, 184, 0.12)',
    },
    topicIcon: {
        fontSize: ms(16),
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
        ...Typography.bodySemiBold,
        fontSize: ms(13),
        color: Colors.softPink,
    },

    // ─── Invite ───────────────────────────────────────
    inviteCard: {
        width: '100%',
        marginBottom: Spacing.md,
    },
    inviteLabel: {
        ...Typography.bodySemiBold,
        fontSize: ms(14),
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: Spacing.md,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.white08,
    },
    dividerText: {
        ...Typography.caption,
        fontSize: ms(12),
        marginHorizontal: Spacing.md,
    },
    shareCodeBox: {
        backgroundColor: Colors.white08,
        borderRadius: Radius.md,
        padding: Spacing.md,
        alignItems: 'center',
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        borderStyle: 'dashed',
        width: '100%',
    },
    shareCode: {
        ...Typography.bodySemiBold,
        fontSize: ms(18),
        color: Colors.goldSparkle,
        letterSpacing: 3,
    },
    copyHint: {
        ...Typography.caption,
        fontSize: ms(11),
        color: Colors.textMuted,
        marginTop: 4,
    },
    codeErrorText: {
        ...Typography.bodyMedium,
        fontSize: ms(12),
        color: Colors.danger,
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
    shareRow: {
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    shareLink: {
        paddingVertical: Spacing.sm,
    },
    shareLinkText: {
        ...Typography.bodyMedium,
        fontSize: ms(14),
        color: Colors.softPink,
    },

});
