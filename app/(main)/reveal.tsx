import GlassCard from '@/components/GlassCard';
import GlowButton from '@/components/GlowButton';
import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import { Colors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';
import { useAppState } from '@/utils/store';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const MOCK_MY_ANSWER = "When they leave little notes around the house for me to find. It always brightens my entire day.";
const MOCK_PARTNER_ANSWER = "The way they hum while cooking dinner. It makes the whole kitchen feel warm and full of love.";

export default function RevealScreen() {
    const router = useRouter();
    const { state } = useAppState();

    return (
        <GradientBackground variant="full">
            <StarBackground />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Stars burst */}
                <Animated.View entering={ZoomIn.delay(200).duration(800)} style={styles.burstContainer}>
                    <Text style={styles.burst1}>✨</Text>
                    <Text style={styles.burst2}>💫</Text>
                    <Text style={styles.burst3}>⭐</Text>
                    <Text style={styles.burst4}>✨</Text>
                </Animated.View>

                {/* Title */}
                <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.titleSection}>
                    <Text style={styles.title}>Today's Reveal 💫</Text>
                    <Text style={styles.subtitle}>Day {state.streakCount} — Daily Connection</Text>
                </Animated.View>

                {/* Question recap */}
                <Animated.View entering={FadeIn.delay(600).duration(600)}>
                    <Text style={styles.questionRecap}>
                        "What's one small thing your partner does that always makes you smile?"
                    </Text>
                </Animated.View>

                {/* Answer Cards — stacked vertically */}
                <Animated.View entering={FadeInUp.delay(800).duration(800)} style={styles.cardWrapper}>
                    <GlassCard style={styles.answerCard}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardDot, { backgroundColor: Colors.lavender }]} />
                            <Text style={styles.cardLabel}>You Said</Text>
                        </View>
                        <Text style={styles.answerText}>{MOCK_MY_ANSWER}</Text>
                    </GlassCard>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(1000).duration(800)} style={styles.cardWrapper}>
                    <GlassCard style={styles.answerCard}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardDot, { backgroundColor: Colors.softPink }]} />
                            <Text style={styles.cardLabel}>Partner Said</Text>
                        </View>
                        <Text style={styles.answerText}>{MOCK_PARTNER_ANSWER}</Text>
                    </GlassCard>
                </Animated.View>

                {/* Streak Banner */}
                <Animated.View entering={FadeInDown.delay(1200).duration(600)}>
                    <LinearGradient
                        colors={Gradients.streakBanner}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.streakBanner}
                    >
                        <Text style={styles.streakEmoji}>🔥</Text>
                        <View style={styles.streakInfo}>
                            <Text style={styles.streakTitle}>{state.streakCount} Day Streak!</Text>
                            <Text style={styles.streakSub}>Your galaxy grew today</Text>
                        </View>
                        <Text style={styles.streakEmoji}>🌌</Text>
                    </LinearGradient>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(1400).duration(600)}>
                    <GlowButton
                        title="Continue Journey ✨"
                        onPress={() => router.replace('/(main)/home')}
                        style={styles.continueButton}
                    />
                </Animated.View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: 70,
        paddingBottom: 40,
    },
    burstContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
    },
    burst1: { position: 'absolute', top: 10, left: width * 0.15, fontSize: 24 },
    burst2: { position: 'absolute', top: 5, right: width * 0.15, fontSize: 20 },
    burst3: { position: 'absolute', top: 30, left: width * 0.35, fontSize: 16 },
    burst4: { position: 'absolute', top: 15, right: width * 0.3, fontSize: 18 },
    titleSection: {
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        ...Typography.heading,
        fontSize: 28,
    },
    subtitle: {
        ...Typography.caption,
        marginTop: Spacing.xs,
    },
    questionRecap: {
        ...Typography.headingItalic,
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 22,
    },
    cardWrapper: {
        marginBottom: Spacing.md,
    },
    answerCard: {
        padding: Spacing.lg,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    cardDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    cardLabel: {
        ...Typography.bodySemiBold,
        fontSize: 13,
        color: Colors.textSecondary,
    },
    answerText: {
        ...Typography.body,
        fontSize: 15,
        lineHeight: 24,
        color: Colors.textPrimary,
    },
    streakBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Radius.lg,
        padding: Spacing.md,
        gap: Spacing.md,
        marginTop: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    streakEmoji: {
        fontSize: 28,
    },
    streakInfo: {
        flex: 1,
    },
    streakTitle: {
        ...Typography.bodySemiBold,
        fontSize: 17,
        color: '#FFF',
    },
    streakSub: {
        ...Typography.body,
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
    },
    continueButton: {
        width: '100%',
    },
    bottomSpacer: {
        height: 20,
    },
});
