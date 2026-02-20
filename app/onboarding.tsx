import AvatarMerge from '@/components/AvatarMerge';
import FloatingCard from '@/components/FloatingCard';
import GlowButton from '@/components/GlowButton';
import GradientBackground from '@/components/GradientBackground';
import PremiumDatePicker from '@/components/PremiumDatePicker';
import StarBackground from '@/components/StarBackground';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { s } from '@/utils/scale';
import { useAppState } from '@/utils/store';
import { createProfile, getProfile, joinPartner, completeOnboarding as markOnboardingComplete, sendOtp, supabase, verifyOtp } from '@/utils/supabase';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
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
type StepType = 'intro' | 'email' | 'otp' | 'name' | 'gender' | 'birthdate' | 'reminder' | 'invite';

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
    { id: 'otp', type: 'otp', title: 'Enter your\nmagic code ✨', subtitle: 'Check your inbox for the magic code' },
    { id: 'name', type: 'name', title: 'What does your\npartner call you?', subtitle: 'This name will appear in your universe' },
    { id: 'gender', type: 'gender', title: 'Help us personalize\nyour universe', subtitle: 'This helps personalize your questions' },
    { id: 'birthdate', type: 'birthdate', icon: '🎂', title: 'When\'s your\nbirthday?', subtitle: 'We\'ll make it extra special' },
    { id: 'reminder', type: 'reminder', icon: '🔔', title: 'When should we\nremind you?', subtitle: 'A daily nudge so you never miss a question' },
    { id: 'invite', type: 'invite', title: 'Invite Your\nOther Half', subtitle: 'Share your code or join theirs' },
];

const REMINDER_OPTIONS = [
    { id: '09:00', label: 'Morning', time: '9 AM', icon: '☀️' },
    { id: '18:00', label: 'Evening', time: '6 PM', icon: '🌅' },
    { id: '22:00', label: 'Night', time: '10 PM', icon: '🌙' },
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
    const { resume } = useLocalSearchParams<{ resume?: string }>();
    const { update } = useAppState();
    const [activeIndex, setActiveIndex] = useState(0);
    const [resumeHandled, setResumeHandled] = useState(false);

    // Form state
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState('');
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [showBirthPicker, setShowBirthPicker] = useState(false);
    const [reminderTime, setReminderTime] = useState('22:00');
    const [inviteCode, setInviteCode] = useState('');
    const [codeError, setCodeError] = useState('');
    const [codeCopied, setCodeCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [myInviteCode, setMyInviteCode] = useState('------');
    const [error, setError] = useState('');

    const otpRefs = useRef<(TextInput | null)[]>([]);

    // ─── Auth Logic ───────────────────────────────────
    const handleSendOtp = async () => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed || !trimmed.includes('@')) {
            setError('Please enter a valid email');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await sendOtp(trimmed);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setActiveIndex(activeIndex + 1); // Go to OTP step
        } catch (err: any) {
            setError(err.message || 'Failed to send code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (code: string) => {
        setError('');
        setLoading(true);
        try {
            await verifyOtp(email.trim().toLowerCase(), code);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Check if profile exists
            const profile = await getProfile();
            if (profile) {
                // Returning user — pre-fill state
                update({
                    userEmail: profile.email,
                    userFirstName: profile.first_name || profile.name?.split(' ')[0] || '',
                    userLastName: profile.last_name || profile.name?.split(' ').slice(1).join(' ') || '',
                    userGender: profile.gender as any,
                    topicPreferences: profile.topic_preferences || [],
                    coupleVibe: profile.couple_vibe || '',
                });

                if (profile.couple_id) {
                    // Fully paired → home
                    update({ hasCompletedOnboarding: true, hasPartner: true });
                    router.replace('/(main)/home');
                } else {
                    // Profile exists but no partner → jump to invite step
                    setMyInviteCode(profile.invite_code || '------');
                    setFirstName(profile.first_name || '');
                    setLastName(profile.last_name || '');
                    setGender(profile.gender || '');
                    const inviteIdx = STEPS.findIndex(s => s.type === 'invite');
                    setActiveIndex(inviteIdx >= 0 ? inviteIdx : activeIndex + 1);
                }
                return;
            }

            // New user → Continue to Name step
            setActiveIndex(activeIndex + 1);
        } catch (err: any) {
            setError(err.message || 'Invalid code');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    // ─── OTP Input Handler ────────────────────────────
    const handleOtpChange = (text: string, index: number) => {
        const newOtp = [...otp];
        if (text.length > 1) { // Paste
            const chars = text.slice(0, 6).split('');
            chars.forEach((c, i) => { if (i + index < 6) newOtp[i + index] = c; });
            setOtp(newOtp);
            if (newOtp.every(c => c !== '')) handleVerifyOtp(newOtp.join(''));
            return;
        }
        newOtp[index] = text;
        setOtp(newOtp);
        if (text && index < 5) otpRefs.current[index + 1]?.focus();
        if (text && newOtp.every(c => c !== '')) handleVerifyOtp(newOtp.join(''));
    };

    // ─── OTP Backspace Handler ────────────────────────
    const handleOtpKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            const newOtp = [...otp];
            newOtp[index - 1] = '';
            setOtp(newOtp);
            otpRefs.current[index - 1]?.focus();
        }
    };

    // ─── Load invite code & handle resume ──────────────
    useEffect(() => {
        (async () => {
            try {
                const profile = await getProfile();
                if (profile?.invite_code) {
                    setMyInviteCode(profile.invite_code);
                }

                // Handle resume param from splash screen
                if (resume && !resumeHandled) {
                    setResumeHandled(true);
                    if (resume === 'invite' && profile) {
                        // Pre-fill from existing profile
                        setFirstName(profile.first_name || '');
                        setLastName(profile.last_name || '');
                        setGender(profile.gender || '');
                        setEmail(profile.email || '');
                        const inviteIdx = STEPS.findIndex(s => s.type === 'invite');
                        if (inviteIdx >= 0) setActiveIndex(inviteIdx);
                    } else if (resume === 'name') {
                        // Skip intros + auth steps, go to name
                        const nameIdx = STEPS.findIndex(s => s.type === 'name');
                        if (nameIdx >= 0) setActiveIndex(nameIdx);
                    }
                }
            } catch {
                // ignore — profile may not exist yet
            }
        })();
    }, [resume]);

    const currentStep = STEPS[activeIndex];
    const totalSteps = STEPS.length;

    // ─── Poll for Partner Connection ──────────────────
    useEffect(() => {
        let interval: any;
        if (currentStep?.type === 'invite' && !loading) {
            interval = setInterval(async () => {
                try {
                    const profile = await getProfile();
                    if (profile?.couple_id) {
                        // Connection found!
                        if (interval) clearInterval(interval);

                        // Mark complete on server
                        await markOnboardingComplete();

                        update({
                            hasPartner: true,
                            hasCompletedOnboarding: true,
                            partnerName: profile.partner_name || 'Partner',
                        });

                        router.replace({
                            pathname: '/connected',
                            params: { name: firstName || 'You', partnerName: profile.partner_name || 'Partner' },
                        });
                    }
                } catch (err) {
                    console.error('Polling error:', err);
                }
            }, 3000); // Poll every 3 seconds
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [currentStep?.type, loading]);

    // ─── Animated Progress ────────────────────────────
    const progressWidth = useSharedValue(1 / totalSteps);
    const progressGlow = useSharedValue(0.3);

    useEffect(() => {
        progressWidth.value = withSpring((activeIndex + 1) / totalSteps, {
            damping: 15,
            stiffness: 120,
            mass: 0.8,
        });
        // Shimmer effect when progress changes
        progressGlow.value = withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0.3, { duration: 600 }),
        );
    }, [activeIndex]);

    const progressAnimStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value * 100}%`,
    }));

    const progressGlowStyle = useAnimatedStyle(() => ({
        shadowOpacity: progressGlow.value,
    }));

    // ─── Validation ───────────────────────────────────
    const canProceed = useCallback((): boolean => {
        if (loading) return false;
        switch (currentStep.type) {
            case 'intro': return true;
            case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            case 'otp': return otp.every(d => d !== '');
            case 'name': return firstName.trim().length >= 2 && lastName.trim().length >= 1;
            case 'gender': return gender !== '';
            case 'birthdate': return birthDate !== null;
            case 'invite': return inviteCode.trim().length === 6;
            default: return true;
        }
    }, [currentStep.type, email, otp, firstName, lastName, gender, birthDate, loading, inviteCode]);

    // ─── Complete Onboarding (join partner) ──────────────
    const finishOnboarding = async (withPartnerCode: string) => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Join partner with their code
            const result = await joinPartner(withPartnerCode);

            update({
                hasPartner: true,
                partnerName: result.partnerName,
            });

            router.replace({
                pathname: '/connected',
                params: { name: firstName, partnerName: result.partnerName },
            });
        } catch (err: any) {
            setCodeError(err.message || 'Failed to connect');
        } finally {
            setLoading(false);
        }
    };

    // ─── Create Profile (Intermediate Step) ───────────
    const createMyProfile = async () => {
        setLoading(true);
        try {
            // Capture device timezone for notifications
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

            // Format birth_date as YYYY-MM-DD
            const birthDateStr = birthDate
                ? `${birthDate.getFullYear()}-${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`
                : undefined;

            const profile = await createProfile({
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                gender,
                email: email || '',
                birth_date: birthDateStr,
                reminder_time: reminderTime,
                timezone: tz,
            });
            setMyInviteCode(profile.invite_code);
            // Update local state
            update({
                userEmail: email,
                userFirstName: firstName.trim(),
                userLastName: lastName.trim(),
                userGender: gender as any,
                userBirthDate: birthDateStr || '',
                reminderTime: reminderTime,
                timezone: tz,
            });
            setActiveIndex(activeIndex + 1); // Go to Invite step
        } catch (err: any) {
            setCodeError(err.message || 'Failed to create profile');
        } finally {
            setLoading(false);
        }
    };

    // ─── Navigation ───────────────────────────────────
    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Intro -> Email
        if (currentStep.type === 'intro' && activeIndex < 3) { // 3 intros
            if (activeIndex < 2) {
                setActiveIndex(activeIndex + 1);
                return;
            }
            // Last intro -> Email
            setActiveIndex(activeIndex + 1);
            return;
        }

        // Email -> OTP
        if (currentStep.type === 'email') {
            handleSendOtp();
            return;
        }

        // OTP -> Name (Handled in handleVerifyOtp)
        if (currentStep.type === 'otp') {
            return; // Wait for auto-submit or manual verify
        }

        // Reminder -> Create Profile -> Invite
        if (currentStep.type === 'reminder') {
            createMyProfile();
            return;
        }

        // Birthdate -> Reminder
        if (currentStep.type === 'birthdate') {
            setActiveIndex(activeIndex + 1);
            return;
        }

        // Invite -> Finish (Requires code or auto-advances via polling)
        if (currentStep.type === 'invite') {
            const code = inviteCode.trim();
            if (code.length === 6) {
                finishOnboarding(code);
            }
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

    const handleCopyCode = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await Clipboard.setStringAsync(myInviteCode);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    };

    // ─── Button Label ─────────────────────────────────
    const getButtonLabel = (): string => {
        if (currentStep.type === 'invite') {
            return inviteCode.trim().length === 6 ? 'Connect Partner' : "Waiting for Your Other Half...";
        }
        if (currentStep.type === 'intro') return 'Continue';
        return loading ? 'Setting up...' : 'Next';
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
                                onChangeText={(t) => { setEmail(t); setError(''); }}
                                placeholder="your@email.com"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoFocus
                            />
                        </Animated.View>
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    </Animated.View>
                );

            case 'otp':
                return (
                    <Animated.View key="otp" entering={FadeInUp.duration(600)} exiting={FadeOut.duration(200)} style={[styles.fieldContent, { alignItems: 'center' }]}>
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
                                        onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        textAlign="center"
                                        autoFocus={i === 0}
                                        selectTextOnFocus
                                    />
                                </Animated.View>
                            ))}
                        </View>
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}
                        <Animated.View entering={FadeIn.delay(600).duration(400)}>
                            <TouchableOpacity onPress={() => { setActiveIndex(activeIndex - 1); setOtp(['', '', '', '', '', '']); }}>
                                <Text style={styles.resendText}>Change email or resend</Text>
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
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="First Name"
                                placeholderTextColor={Colors.textMuted}
                                autoFocus
                            />
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(300).duration(400).springify()} style={[styles.inputWrapper, { marginTop: Spacing.md }]}>
                            <Text style={styles.inputIcon}>🌟</Text>
                            <TextInput
                                style={styles.input}
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Last Name"
                                placeholderTextColor={Colors.textMuted}
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

            case 'birthdate':
                return (
                    <Animated.View key="birthdate" entering={FadeInUp.duration(600)} exiting={FadeOut.duration(200)} style={styles.fieldContent}>
                        <Text style={styles.fieldTitle}>{currentStep.title}</Text>
                        <Text style={styles.fieldSubtitle}>{currentStep.subtitle}</Text>

                        <Animated.View entering={FadeInUp.delay(200).duration(400).springify()} style={styles.birthdateContainer}>
                            <>
                                <TouchableOpacity
                                    onPress={() => setShowBirthPicker(true)}
                                    style={styles.birthdateButton}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.birthdateIcon}>🎂</Text>
                                    <Text style={styles.birthdateText}>
                                        {birthDate
                                            ? birthDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                            : 'Tap to select your birthday date'}
                                    </Text>
                                </TouchableOpacity>
                                <PremiumDatePicker
                                    visible={showBirthPicker}
                                    onClose={() => setShowBirthPicker(false)}
                                    initialDate={birthDate || new Date(2000, 0, 1)}
                                    maxDate={new Date()}
                                    title="Select Your Birthday"
                                    onDateSelected={(date) => {
                                        setBirthDate(date);
                                    }}
                                />
                            </>
                        </Animated.View>
                    </Animated.View>
                );

            case 'reminder':
                return (
                    <Animated.View key="reminder" entering={FadeInUp.duration(600)} exiting={FadeOut.duration(200)} style={styles.fieldContent}>
                        <Text style={styles.fieldTitle}>{currentStep.title}</Text>
                        <Text style={styles.fieldSubtitle}>{currentStep.subtitle}</Text>
                        <View style={styles.reminderRow}>
                            {REMINDER_OPTIONS.map((opt, i) => (
                                <Animated.View key={opt.id} entering={FadeInUp.delay(i * 100 + 200).duration(500).springify()}>
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setReminderTime(opt.id);
                                        }}
                                        style={[styles.reminderCard, reminderTime === opt.id && styles.reminderCardSelected]}
                                    >
                                        <Text style={styles.reminderIcon}>{opt.icon}</Text>
                                        <Text style={[styles.reminderTime, reminderTime === opt.id && styles.reminderTimeSelected]}>
                                            {opt.time}
                                        </Text>
                                        <Text style={[styles.reminderLabel, reminderTime === opt.id && styles.reminderLabelSelected]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </View>
                    </Animated.View>
                );

            case 'invite':
                return (
                    <Animated.View key="invite" entering={FadeInUp.duration(600)} exiting={FadeOut.duration(200)} style={{ ...styles.fieldContent, alignItems: 'center' }}>
                        <Animated.View entering={FadeIn.delay(100).duration(500)}>
                            <AvatarMerge size={s(60)} />
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
                                        placeholder="XXXXXX"
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
                                <Text style={styles.shareCode}>{myInviteCode}</Text>
                                <Text style={styles.copyHint}>
                                    {codeCopied ? '✓ Copied!' : 'Tap to copy'}
                                </Text>
                            </Animated.View>
                        </TouchableOpacity>
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
                            <Animated.View style={[styles.progressFill, progressAnimStyle, progressGlowStyle]} />
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
                            loading={loading}
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
        paddingTop: Spacing.xs,
    },

    // ─── Top bar ──────────────────────────────────────
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
    },
    backButton: {
        width: Spacing.xl,
        height: Spacing.xl,
        borderRadius: 18,
        backgroundColor: Colors.white08,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backArrow: {
        ...Typography.xxl,
        color: Colors.textPrimary,
        marginTop: -2,
    },
    backPlaceholder: {
        width: Spacing.xl,
        height: Spacing.xl,
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
        shadowColor: Colors.softPink,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 8,
        elevation: 4,
    },
    stepIndicator: {
        ...Typography.caption,
        fontSize: s(11),
        color: Colors.textMuted,
        minWidth: Spacing.xl,
        textAlign: 'right',
    },
    stepPlaceholder: {
        width: Spacing.xl,
    },

    // ─── Content ──────────────────────────────────────
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
    },
    bottomContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
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
        fontSize: s(72),
        marginBottom: Spacing.xl,
    },
    introTitle: {
        ...Typography.heading,
        fontSize: s(34),
        textAlign: 'center',
        lineHeight: s(44),
        marginBottom: Spacing.lg,
    },
    introSubtitle: {
        ...Typography.body,
        fontSize: s(16),
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: s(24),
    },

    // ─── Field screens ────────────────────────────────
    fieldContent: {
        // alignItems: 'center',
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
        fontSize: s(18),
        marginRight: Spacing.sm,
    },
    input: {
        flex: 1,
        ...Typography.body,
        fontSize: s(16),
        color: Colors.textPrimary,
        paddingVertical: Spacing.md,
    },

    errorText: {
        ...Typography.caption,
        color: Colors.danger,
        marginTop: Spacing.sm,
    },
    // ─── OTP ──────────────────────────────────────────
    otpRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
        justifyContent: 'center',
    },
    otpInput: {
        width: s(44),
        height: s(52),
        borderRadius: Radius.md,
        borderWidth: 1.5,
        borderColor: Colors.inputBorder,
        backgroundColor: Colors.inputBg,
        ...Typography.heading,
        fontSize: s(24),
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    otpFilled: {
        borderColor: Colors.softPink,
        backgroundColor: 'rgba(199, 125, 184, 0.08)',
    },
    resendText: {
        ...Typography.bodyMedium,
        fontSize: s(13),
        color: Colors.softPink,
    },

    // ─── Gender chips / Vibe chips ────────────────────
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
        fontSize: s(24),
    },
    chipLabel: {
        ...Typography.bodyMedium,
        fontSize: s(16),
        color: Colors.textSecondary,
        flex: 1,
    },
    chipLabelSelected: {
        color: Colors.textPrimary,
    },
    chipCheck: {
        fontSize: s(16),
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
        fontSize: s(16),
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
        ...Typography.bodySemiBold,
        fontSize: s(13),
        color: Colors.softPink,
    },

    // ─── Reminder ─────────────────────────────────────
    reminderRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        width: '100%',
    },
    reminderCard: {
        alignItems: 'center',
        backgroundColor: Colors.inputBg,
        borderRadius: Radius.lg,
        borderWidth: 1.5,
        borderColor: Colors.inputBorder,
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.md,
        gap: Spacing.xs,
    },
    reminderCardSelected: {
        borderColor: Colors.softPink,
        backgroundColor: 'rgba(199, 125, 184, 0.1)',
    },
    reminderIcon: {
        fontSize: s(28),
        marginBottom: Spacing.xs,
    },
    reminderTime: {
        ...Typography.bodySemiBold,
        fontSize: s(16),
        color: Colors.textSecondary,
    },
    reminderTimeSelected: {
        color: Colors.textPrimary,
    },
    reminderLabel: {
        ...Typography.caption,
        fontSize: s(12),
        color: Colors.textMuted,
    },
    reminderLabelSelected: {
        color: Colors.textSecondary,
    },

    // ─── Invite ───────────────────────────────────────
    inviteCard: {
        width: '100%',
        marginBottom: Spacing.md,
    },
    inviteLabel: {
        ...Typography.bodySemiBold,
        fontSize: s(14),
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
        fontSize: s(12),
        marginHorizontal: Spacing.md,
    },
    shareCodeBox: {
        width: '100%',
        backgroundColor: Colors.white08,
        padding: Spacing.xl,
        borderRadius: Radius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.white12,
        marginTop: Spacing.md,
    },
    shareCode: {
        ...Typography.heading,
        color: Colors.softPink,
        letterSpacing: 4,
    },
    copyHint: {
        ...Typography.caption,
        color: Colors.textMuted,
        marginTop: Spacing.sm,
    },
    codeErrorText: {
        ...Typography.bodyMedium,
        fontSize: s(12),
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
        fontSize: s(14),
        color: Colors.softPink,
    },

    // ─── Birthdate ────────────────────────────────────
    birthdateContainer: {
        alignItems: 'center',
        marginTop: Spacing.lg,
        width: '100%',
    },
    birthdateButton: {
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
    birthdateIcon: {
        fontSize: s(24),
        marginRight: Spacing.sm,
    },
    birthdateText: {
        ...Typography.bodySemiBold,
        fontSize: s(16),
        color: Colors.textPrimary,
    },
});
