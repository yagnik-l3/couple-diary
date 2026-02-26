import GlowButton from '@/components/GlowButton';
import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { s } from '@/utils/scale';
import { getProfile, sendOtp, verifyOtp } from '@/utils/supabase';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

type Step = 'email' | 'otp';

export default function LoginScreen() {
    const router = useRouter();
    const posthog = usePostHog();
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const otpRefs = useRef<(TextInput | null)[]>([]);

    // ─── Send OTP ─────────────────────────────────────
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
            setStep('otp');
        } catch (err: any) {
            setError(err.message || 'Failed to send code');
        } finally {
            setLoading(false);
        }
    };

    // ─── Verify OTP ───────────────────────────────────
    const handleVerifyOtp = async (code: string) => {
        setError('');
        setLoading(true);
        try {
            await verifyOtp(email.trim().toLowerCase(), code);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Identify the user in PostHog after successful login
            posthog.identify(email.trim().toLowerCase(), {
                $set: { email: email.trim().toLowerCase() },
                $set_once: { first_login_date: new Date().toISOString() },
            });
            posthog.capture('user_logged_in', {
                login_method: 'email_otp',
            });

            // Fetch profile to determine where to send them
            const profile = await getProfile();

            if (!profile) {
                // No profile -> onboarding name step
                router.replace('/onboarding?resume=name');
            } else if (!profile.couple_id) {
                // Profile exists but no partner -> onboarding invite step
                router.replace('/onboarding?resume=invite');
            } else {
                // Fully set up -> home
                router.replace('/(main)/home');
            }
        } catch (err: any) {
            setError(err.message || 'Invalid code');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            posthog.capture('$exception', {
                $exception_list: [
                    {
                        type: 'LoginError',
                        value: err.message || 'OTP verification failed',
                    },
                ],
                $exception_source: 'login',
            });
        } finally {
            setLoading(false);
        }
    };

    // ─── OTP Input Handler ────────────────────────────
    const handleOtpChange = (text: string, index: number) => {
        const newOtp = [...otp];
        // Handle paste
        if (text.length > 1) {
            const chars = text.slice(0, 6).split('');
            chars.forEach((c, i) => {
                if (i + index < 6) newOtp[i + index] = c;
            });
            setOtp(newOtp);
            const lastIdx = Math.min(index + chars.length, 5);
            otpRefs.current[lastIdx]?.focus();
            if (newOtp.every(c => c !== '')) {
                handleVerifyOtp(newOtp.join(''));
            }
            return;
        }

        newOtp[index] = text;
        setOtp(newOtp);

        if (text && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all filled
        if (text && newOtp.every(c => c !== '')) {
            handleVerifyOtp(newOtp.join(''));
        }
    };

    const handleOtpKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
            const newOtp = [...otp];
            newOtp[index - 1] = '';
            setOtp(newOtp);
        }
    };

    return (
        <GradientBackground>
            <StarBackground />
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
                        <Text style={styles.logoIcon}>✨</Text>
                        <Text style={styles.title}>Couple{'\n'}Diary</Text>
                        <Text style={styles.subtitle}>
                            {step === 'email'
                                ? 'Enter your email to get started'
                                : `We sent a code to\n${email}`}
                        </Text>
                    </Animated.View>

                    {/* Email Step */}
                    {step === 'email' && (
                        <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.formSection}>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.emailInput}
                                    value={email}
                                    onChangeText={(t) => { setEmail(t); setError(''); }}
                                    placeholder="your@email.com"
                                    placeholderTextColor={Colors.textMuted}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoFocus
                                />
                            </View>

                            {error ? <Text style={styles.errorText}>{error}</Text> : null}

                            <GlowButton
                                title="Send Magic Code ✨"
                                onPress={handleSendOtp}
                                disabled={!email.trim()}
                                loading={loading}
                                style={styles.button}
                            />
                        </Animated.View>
                    )}

                    {/* OTP Step */}
                    {step === 'otp' && (
                        <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.formSection}>
                            <View style={styles.otpContainer}>
                                {otp.map((digit, i) => (
                                    <TextInput
                                        key={i}
                                        ref={(ref) => { otpRefs.current[i] = ref; }}
                                        style={[
                                            styles.otpInput,
                                            digit ? styles.otpInputFilled : null,
                                        ]}
                                        value={digit}
                                        onChangeText={(t) => handleOtpChange(t, i)}
                                        onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        autoFocus={i === 0}
                                        selectTextOnFocus
                                    />
                                ))}
                            </View>

                            {error ? <Text style={styles.errorText}>{error}</Text> : null}

                            {loading && (
                                <View style={styles.loadingRow}>
                                    <ActivityIndicator color={Colors.softPink} />
                                    <Text style={styles.loadingText}>Verifying...</Text>
                                </View>
                            )}

                            <Text
                                style={styles.resendLink}
                                onPress={() => {
                                    setStep('email');
                                    setOtp(['', '', '', '', '', '']);
                                    setError('');
                                }}
                            >
                                ← Change email or resend
                            </Text>
                        </Animated.View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: {
        flexGrow: 1,
        paddingHorizontal: Spacing.xl,
        justifyContent: 'center',
        paddingBottom: s(60),
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xxxl,
    },
    logoIcon: {
        fontSize: s(48),
        marginBottom: Spacing.lg,
    },
    title: {
        ...Typography.heading,
        fontSize: s(38),
        textAlign: 'center',
        lineHeight: s(46),
    },
    subtitle: {
        ...Typography.body,
        fontSize: s(15),
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: Spacing.md,
        lineHeight: s(22),
    },
    formSection: {
        gap: Spacing.lg,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.inputBg,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.inputBorder,
        overflow: 'hidden',
    },
    emailInput: {
        flex: 1,
        ...Typography.body,
        fontSize: s(16),
        color: Colors.textPrimary,
        paddingVertical: Spacing.md + 2,
        paddingHorizontal: Spacing.lg,
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.sm + 2,
    },
    otpInput: {
        width: s(48),
        height: s(56),
        borderRadius: Radius.md,
        borderWidth: 1.5,
        borderColor: Colors.inputBorder,
        backgroundColor: Colors.inputBg,
        ...Typography.bodySemiBold,
        fontSize: s(22),
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    otpInputFilled: {
        borderColor: Colors.softPink,
        backgroundColor: 'rgba(199, 125, 184, 0.08)',
    },
    button: {
        width: '100%',
    },
    errorText: {
        ...Typography.caption,
        color: Colors.danger,
        textAlign: 'center',
        fontSize: s(13),
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    loadingText: {
        ...Typography.body,
        fontSize: s(14),
        color: Colors.textSecondary,
    },
    resendLink: {
        ...Typography.bodyMedium,
        fontSize: s(13),
        color: Colors.lavender,
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
});
