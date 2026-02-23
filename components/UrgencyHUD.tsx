import { Colors, Gradients, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import Animated, {
    Easing,
    FadeInUp,
    FadeOutDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

interface UrgencyHUDProps {
    state: 'answer' | 'waiting' | 'reveal' | 'done';
    countdown: string;
    partnerName?: string;
    onNudge: () => void;
    lastNudgeAt?: string;
    nudgeCooldownMinutes?: number;
    style?: ViewStyle;
}

export default function UrgencyHUD({
    state,
    countdown,
    partnerName = 'Partner',
    onNudge,
    lastNudgeAt,
    nudgeCooldownMinutes = 30,
    style,
}: UrgencyHUDProps) {
    const pulse = useSharedValue(1);
    const [cooldownRemaining, setCooldownRemaining] = React.useState(0);

    // Calculate cooldown
    useEffect(() => {
        const getRemaining = () => {
            if (!lastNudgeAt) return 0;
            const elapsed = Date.now() - new Date(lastNudgeAt).getTime();
            const cooldown = nudgeCooldownMinutes * 60 * 1000;
            return Math.max(0, cooldown - elapsed);
        };

        const tick = () => {
            setCooldownRemaining(getRemaining());
        };

        tick();
        const interval = setInterval(tick, 1000); // 1s tick for button state
        return () => clearInterval(interval);
    }, [lastNudgeAt, nudgeCooldownMinutes]);

    const isNudgeOnCooldown = cooldownRemaining > 0;
    const nudgeCooldownLabel = Math.ceil(cooldownRemaining / 60000);

    useEffect(() => {
        if (state === 'answer') {
            pulse.value = withRepeat(
                withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
        } else {
            pulse.value = withTiming(1);
        }
    }, [state]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
    }));

    // Config based on state
    const getConfig = () => {
        const [h, m] = countdown.split(':').map(Number);
        const totalMinutes = (h || 0) * 60 + (m || 0);
        const isCritical = state === 'answer' && totalMinutes < 120; // < 2 hours

        switch (state) {
            case 'answer':
                return {
                    icon: isCritical ? '🧨' : '🔥',
                    title: isCritical ? 'URGENT: Save your streak!' : 'Time is ticking...',
                    gradient: isCritical ? Gradients.streakBanner : Gradients.button,
                    action: null,
                    isCritical,
                };
            case 'waiting':
                return {
                    icon: '⚡️',
                    title: `Waiting for ${partnerName}`,
                    gradient: Gradients.button,
                    action: 'nudge',
                };
            case 'reveal':
            case 'done':
                return {
                    icon: '✨',
                    title: 'All systems synced',
                    gradient: Gradients.glass,
                    action: null,
                };
            default:
                return {
                    icon: '❓',
                    title: 'Loading...',
                    gradient: Gradients.glass,
                    action: null,
                };
        }
    };

    const config = getConfig();

    return (
        <Animated.View
            entering={FadeInUp.delay(600).duration(600)}
            exiting={FadeOutDown}
            style={[styles.container, style]}
        >
            <View style={styles.glowContainer}>
                {/* Gradient Border Wrapper */}
                <LinearGradient
                    colors={config.gradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBorder}
                >
                    {/* Glass Content */}
                    <View style={styles.glassContent}>
                        {Platform.OS === 'ios' ? (
                            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                        ) : (
                            <View style={[StyleSheet.absoluteFill, styles.fallbackBlur]} />
                        )}

                        <View style={styles.row}>
                            {/* Icon with optional pulse */}
                            <Animated.Text style={[
                                styles.icon,
                                (state === 'answer' || (config as any).isCritical) && animatedStyle
                            ]}>
                                {config.icon}
                            </Animated.Text>


                            {/* Text Info */}
                            <View style={styles.textContainer}>
                                <Text style={styles.title}>{config.title}</Text>
                                <Text style={styles.timer}>
                                    {state === 'reveal' ? `Next question in ${countdown}` : `${countdown} remaining`}
                                </Text>
                            </View>

                            {/* Action Button */}
                            {config.action === 'nudge' && (
                                <TouchableOpacity
                                    onPress={onNudge}
                                    disabled={isNudgeOnCooldown}
                                    activeOpacity={0.7}
                                    style={[styles.nudgeButton, isNudgeOnCooldown && styles.nudgeButtonSent]}
                                >
                                    <Text style={[styles.nudgeText, isNudgeOnCooldown && styles.nudgeTextSent]}>
                                        {isNudgeOnCooldown ? `${nudgeCooldownLabel}m 💌` : 'Nudge'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </LinearGradient>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: Spacing.sm,
        marginBottom: Spacing.sm,
        zIndex: 20,
    },
    glowContainer: {
        ...Shadows.glow,
        shadowOpacity: 0.2, // slightly reduced glow
    },
    gradientBorder: {
        borderRadius: Radius.full,
        padding: 1.5, // Border width
    },
    glassContent: {
        borderRadius: Radius.full,
        overflow: 'hidden',
        backgroundColor: 'rgba(10, 5, 25, 0.6)', // base tint
    },
    fallbackBlur: {
        backgroundColor: 'rgba(18, 10, 40, 0.9)',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.md,
        gap: Spacing.md,
    },
    icon: {
        fontSize: Typography.xxl.fontSize,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        ...Typography.bodySemiBold,
        fontSize: Typography.md.fontSize,
        color: Colors.textPrimary,
    },
    timer: {
        ...Typography.caption,
        fontSize: Typography.sm.fontSize,
        color: Colors.textSecondary,
        fontVariant: ['tabular-nums'],
    },
    nudgeButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    nudgeButtonSent: {
        backgroundColor: 'rgba(110, 203, 138, 0.15)',
        borderColor: 'rgba(110, 203, 138, 0.3)',
    },
    nudgeText: {
        ...Typography.bodySemiBold,
        fontSize: Typography.sm.fontSize,
        color: Colors.textPrimary,
    },
    nudgeTextSent: {
        color: Colors.success,
    },
});
