import GlowButton from '@/components/GlowButton';
import GradientBackground from '@/components/GradientBackground';
import OutlineButton from '@/components/OutlineButton';
import StarBackground from '@/components/StarBackground';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { QuestionService } from '@/utils/questionService';
import { useAppState } from '@/utils/store';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeInUp,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function WaitingScreen() {
    const router = useRouter();
    const { daily_id } = useLocalSearchParams<{ daily_id: string }>();
    const { state, update } = useAppState();
    const orbit1 = useSharedValue(0);
    const orbit2 = useSharedValue(0);
    const lockGlow = useSharedValue(0);
    const nudgeScale = useSharedValue(1);

    const [nudgeSent, setNudgeSent] = useState(false);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const [partnerAnswered, setPartnerAnswered] = useState(false);

    // ─── Poll for partner answer ──────────────────────
    useEffect(() => {
        if (!daily_id) return;

        const poll = async () => {
            try {
                const status = await QuestionService.getAnswerStatus(daily_id);
                if (status.partnerAnswered) {
                    setPartnerAnswered(true);
                }
            } catch (err) {
                console.warn('Poll error:', err);
            }
        };

        poll(); // immediate check
        const interval = setInterval(poll, 5000);
        return () => clearInterval(interval);
    }, [daily_id]);

    // Auto-navigate to reveal when partner answers
    useEffect(() => {
        if (partnerAnswered && daily_id) {
            setTimeout(() => {
                router.replace({ pathname: '/(main)/reveal', params: { daily_id } } as any);
            }, 1500);
        }
    }, [partnerAnswered]);

    // ─── Cooldown Timer ───────────────────────────────
    const getCooldownMs = useCallback(() => {
        if (!state.lastNudgeTime) return 0;
        const elapsed = Date.now() - new Date(state.lastNudgeTime).getTime();
        const cooldown = state.nudgeCooldownMinutes * 60 * 1000;
        return Math.max(0, cooldown - elapsed);
    }, [state.lastNudgeTime, state.nudgeCooldownMinutes]);

    useEffect(() => {
        const tick = () => {
            const remaining = getCooldownMs();
            setCooldownRemaining(remaining);
        };
        tick();
        const interval = setInterval(tick, 10000);
        return () => clearInterval(interval);
    }, [getCooldownMs]);

    const isOnCooldown = cooldownRemaining > 0;
    const cooldownMinutes = Math.ceil(cooldownRemaining / 60000);

    // ─── Nudge Handler ────────────────────────────────
    const handleNudge = async () => {
        if (isOnCooldown) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        nudgeScale.value = withSequence(
            withSpring(1.15, { damping: 4, stiffness: 400 }),
            withSpring(1, { damping: 8, stiffness: 200 }),
        );
        update({ lastNudgeTime: new Date().toISOString() });
        setNudgeSent(true);
        setCooldownRemaining(state.nudgeCooldownMinutes * 60 * 1000);
        setTimeout(() => setNudgeSent(false), 3000);

        // Insert nudge into DB — this triggers a push notification via Postgres trigger
        try {
            const { supabase } = await import('@/utils/supabase');
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('couple_id')
                    .eq('id', user.id)
                    .single();
                if (profile?.couple_id) {
                    await supabase.from('nudges').insert({
                        sender_id: user.id,
                        couple_id: profile.couple_id,
                    });
                }
            }
        } catch (err) {
            console.warn('Nudge insert error:', err);
        }
    };

    const nudgeBtnStyle = useAnimatedStyle(() => ({
        transform: [{ scale: nudgeScale.value }],
    }));

    // ─── Orbital Animations ───────────────────────────
    useEffect(() => {
        orbit1.value = withRepeat(
            withTiming(360, { duration: 8000, easing: Easing.linear }),
            -1,
            false
        );
        orbit2.value = withRepeat(
            withTiming(-360, { duration: 12000, easing: Easing.linear }),
            -1,
            false
        );
        lockGlow.value = withRepeat(
            withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const planet1Style = useAnimatedStyle(() => ({
        transform: [{ rotate: `${orbit1.value}deg` }, { translateX: 60 }],
    }));

    const planet2Style = useAnimatedStyle(() => ({
        transform: [{ rotate: `${orbit2.value}deg` }, { translateX: 80 }],
    }));

    const lockGlowStyle = useAnimatedStyle(() => ({
        opacity: 0.3 + lockGlow.value * 0.4,
        transform: [{ scale: 1 + lockGlow.value * 0.1 }],
    }));

    return (
        <GradientBackground variant="full">
            <StarBackground />
            <View style={styles.container}>
                {/* Orbiting planets animation */}
                <Animated.View entering={FadeIn.delay(300).duration(1000)} style={styles.orbitContainer}>
                    {/* Orbit paths */}
                    <View style={[styles.orbitPath, { width: 120, height: 120, borderRadius: 60 }]} />
                    <View style={[styles.orbitPath, { width: 160, height: 160, borderRadius: 80 }]} />

                    {/* Lock icon center */}
                    <Animated.View style={[styles.lockGlow, lockGlowStyle]} />
                    <Text style={styles.lockIcon}>{partnerAnswered ? '🔓' : '🔒'}</Text>

                    {/* Orbiting planets */}
                    <Animated.View style={[styles.planet, planet1Style]}>
                        <View style={styles.planet1} />
                    </Animated.View>
                    <Animated.View style={[styles.planet, planet2Style]}>
                        <View style={styles.planet2} />
                    </Animated.View>
                </Animated.View>

                {/* Text */}
                <Animated.View entering={FadeInUp.delay(600).duration(800)} style={styles.textSection}>
                    <Text style={styles.title}>
                        {partnerAnswered
                            ? "Both answers are in!\nHeading to reveal..."
                            : "Waiting for your\npartner's answer"}
                    </Text>
                    <Text style={styles.subtitle}>
                        {partnerAnswered
                            ? 'The stars are aligning ✨'
                            : 'The universe holds its breath...\nBoth answers are needed for the reveal ✨'}
                    </Text>
                </Animated.View>

                {/* Status */}
                <Animated.View entering={FadeInUp.delay(900).duration(600)} style={styles.statusCard}>
                    <View style={styles.statusRow}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>You answered</Text>
                        <Text style={styles.statusCheck}>✓</Text>
                    </View>
                    <View style={styles.statusDivider} />
                    <View style={styles.statusRow}>
                        <View style={partnerAnswered ? styles.statusDot : styles.statusDotWaiting} />
                        <Text style={styles.statusText}>Partner</Text>
                        <Text style={partnerAnswered ? styles.statusCheck : styles.statusWaiting}>
                            {partnerAnswered ? '✓' : 'waiting...'}
                        </Text>
                    </View>
                </Animated.View>

                {/* Nudge Button */}
                {!partnerAnswered && (
                    <Animated.View entering={FadeInUp.delay(1100).duration(600)} style={[nudgeBtnStyle, styles.nudgeContainer]}>
                        <OutlineButton
                            title={isOnCooldown ? `Nudge again in ${cooldownMinutes}m` : 'Nudge Partner 💌'}
                            onPress={handleNudge}
                            disabled={isOnCooldown}
                            style={styles.nudgeButton}
                        />
                    </Animated.View>
                )}

                {/* Nudge Sent Toast */}
                {nudgeSent && (
                    <Animated.View
                        entering={FadeInUp.duration(400).springify()}
                        exiting={FadeOut.duration(300)}
                        style={styles.nudgeToast}
                    >
                        <Text style={styles.nudgeToastText}>Nudge Sent! 💌</Text>
                    </Animated.View>
                )}

                {partnerAnswered && (
                    <GlowButton
                        title="View Reveal 💫"
                        onPress={() => router.replace({ pathname: '/(main)/reveal', params: { daily_id } } as any)}
                        style={styles.revealButton}
                    />
                )}

                {/* Back Button */}
                <Animated.View entering={FadeInUp.delay(1300).duration(600)} style={styles.revealButton}>
                    <OutlineButton
                        title="Back to Home"
                        onPress={() => router.replace('/(main)/home')}
                        style={styles.revealButton}
                    />
                </Animated.View>
            </View>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    orbitContainer: {
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    orbitPath: {
        position: 'absolute',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderStyle: 'dashed',
    },
    lockGlow: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(108, 61, 184, 0.25)',
    },
    lockIcon: {
        fontSize: 40,
    },
    planet: {
        position: 'absolute',
    },
    planet1: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: Colors.lavender,
        ...Shadows.soft,
    },
    planet2: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.softPink,
        ...Shadows.soft,
    },
    textSection: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    title: {
        ...Typography.heading,
        fontSize: 26,
        textAlign: 'center',
        lineHeight: 34,
        marginBottom: Spacing.md,
    },
    subtitle: {
        ...Typography.body,
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    statusCard: {
        width: '100%',
        backgroundColor: Colors.cardBg,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        marginBottom: Spacing.md,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.success,
    },
    statusDotWaiting: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.goldSparkle,
    },
    statusText: {
        ...Typography.bodyMedium,
        fontSize: 15,
        flex: 1,
    },
    statusCheck: {
        ...Typography.bodySemiBold,
        color: Colors.success,
        fontSize: 16,
    },
    statusWaiting: {
        ...Typography.caption,
        color: Colors.goldSparkle,
        fontSize: 13,
    },
    statusDivider: {
        height: 1,
        backgroundColor: Colors.white08,
        marginVertical: Spacing.md,
    },
    nudgeContainer: {
        width: '100%',
        marginBottom: Spacing.md,
    },
    nudgeButton: {
        width: '100%',
    },
    nudgeToast: {
        position: 'absolute',
        top: 100,
        backgroundColor: Colors.cardBg,
        borderRadius: Radius.lg,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.softPink,
    },
    nudgeToastText: {
        ...Typography.bodySemiBold,
        fontSize: 16,
        color: Colors.softPink,
    },
    revealButton: {
        width: '100%',
    },
});
