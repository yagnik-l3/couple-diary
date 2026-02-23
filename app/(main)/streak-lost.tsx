import GlowButton from '@/components/GlowButton';
import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAppState } from '@/utils/store';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function StreakLostScreen() {
    const router = useRouter();
    const { state, update } = useAppState();
    const { acknowledgeStreakLoss } = require('@/utils/supabase');

    const handleRestart = async () => {
        try {
            await acknowledgeStreakLoss();
            update({
                streakCount: 0,
                sawStreakLost: true
            });
            router.replace('/(main)/home');
        } catch (err) {
            console.warn('Restart error:', err);
        }
    };

    return (
        <GradientBackground variant="full">
            <StarBackground />
            <View style={styles.container}>
                {/* Fading galaxy visual */}
                <Animated.View entering={FadeIn.delay(300).duration(1500)} style={styles.galaxySection}>
                    <View style={styles.fadingGalaxy}>
                        <View style={styles.fadingRing1} />
                        <View style={styles.fadingRing2} />
                        <View style={styles.fadingCore} />
                    </View>
                    <Text style={styles.sadEmoji}>🌑</Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(600).duration(800)} style={styles.textSection}>
                    <Text style={styles.title}>Your streak{'\n'}has ended</Text>
                    <Text style={styles.message}>
                        Every universe restarts.{'\n'}
                        But every restart holds new light.
                    </Text>
                    <Text style={styles.encouragement}>
                        Begin again ✨{'\n'}
                        Your story isn't over.
                    </Text>
                </Animated.View>

                {/* Stats */}
                <Animated.View entering={FadeInUp.delay(900).duration(600)} style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{state.bestStreak || 0}</Text>
                        <Text style={styles.statLabel}>Best Streak</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{state.questionsAnswered || 0}</Text>
                        <Text style={styles.statLabel}>Questions</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{state.streakCount || 0}</Text>
                        <Text style={styles.statLabel}>Lost Streak</Text>
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(1100).duration(600)}>
                    <GlowButton
                        title="Restart Journey ✨"
                        onPress={handleRestart}
                        style={styles.restartButton}
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
    galaxySection: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 160,
        height: 160,
        marginBottom: Spacing.xl,
    },
    fadingGalaxy: {
        position: 'absolute',
        width: 160,
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fadingRing1: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 1,
        borderColor: 'rgba(108, 61, 184, 0.15)',
    },
    fadingRing2: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: 'rgba(199, 125, 184, 0.12)',
    },
    fadingCore: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(108, 61, 184, 0.15)',
    },
    sadEmoji: {
        fontSize: 48,
        position: 'absolute',
    },
    textSection: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    title: {
        ...Typography.heading,
        fontSize: 28,
        textAlign: 'center',
        lineHeight: 36,
        marginBottom: Spacing.md,
    },
    message: {
        ...Typography.body,
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: Spacing.md,
    },
    encouragement: {
        ...Typography.headingItalic,
        fontSize: 16,
        color: Colors.softPink,
        textAlign: 'center',
        lineHeight: 24,
    },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: Colors.cardBg,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        width: '100%',
        marginBottom: Spacing.xl,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        ...Typography.heading,
        fontSize: 24,
        marginBottom: 4,
    },
    statLabel: {
        ...Typography.caption,
        fontSize: 12,
    },
    statDivider: {
        width: 1,
        backgroundColor: Colors.white08,
    },
    restartButton: {
        width: '100%',
        minWidth: 300,
    },
    restartLink: {
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    restartLinkText: {
        ...Typography.caption,
        color: Colors.textMuted,
        textDecorationLine: 'underline',
    },
});
