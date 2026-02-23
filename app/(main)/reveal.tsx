import GlassCard from '@/components/GlassCard';
import GlowButton from '@/components/GlowButton';
import GradientBackground from '@/components/GradientBackground';
import SkeletonLoader from '@/components/SkeletonLoader';
import StarBackground from '@/components/StarBackground';
import { Colors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';
import { QuestionService } from '@/utils/questionService';
import { useAppState } from '@/utils/store';
import { incrementStreak, supabase } from '@/utils/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function RevealScreen() {
    const router = useRouter();
    const { daily_id } = useLocalSearchParams<{ daily_id: string }>();
    const { state, update } = useAppState();
    const [loading, setLoading] = useState(true);
    const [questionText, setQuestionText] = useState('');
    const [myAnswer, setMyAnswer] = useState('');
    const [partnerAnswer, setPartnerAnswer] = useState('');
    const [partnerName, setPartnerName] = useState('Partner');
    const [streakUpdated, setStreakUpdated] = useState(false);

    useEffect(() => {
        if (!daily_id) return;

        (async () => {
            try {
                // Fetch the question text
                const q = await QuestionService.getTodayQuestion();
                if (q) setQuestionText(q.text);

                // Fetch both answers
                const answers = await QuestionService.getRevealAnswers(daily_id);
                const { data: { user } } = await supabase.auth.getUser();

                for (const ans of answers) {
                    if (ans.user_id === user?.id) {
                        setMyAnswer(ans.content);
                    } else {
                        setPartnerAnswer(ans.content);
                        setPartnerName((ans as any).profile?.first_name || 'Partner');
                    }
                }

                // Increment streak (only once per question — deduped by daily_id)
                if (!streakUpdated) {
                    try {
                        const coupleData = await incrementStreak(daily_id);
                        update({
                            streakCount: coupleData.streak_count,
                            bestStreak: coupleData.best_streak,
                            hasAnsweredToday: true,
                            partnerAnsweredToday: true,
                        });
                        setStreakUpdated(true);
                    } catch (err) {
                        console.warn('Streak update note:', err);
                    }
                }
            } catch (err) {
                console.error('Reveal load error:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [daily_id]);

    if (loading) {
        return (
            <GradientBackground variant="full">
                <StarBackground />
                <View style={styles.scrollContent}>
                    {/* Title Skeleton */}
                    <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
                        <SkeletonLoader.Line width={200} height={32} style={{ marginBottom: 8 }} />
                        <SkeletonLoader.Line width={140} height={16} />
                    </View>

                    {/* Question Skeleton */}
                    <View style={{ alignItems: 'center', marginBottom: Spacing.xl, paddingHorizontal: Spacing.lg }}>
                        <SkeletonLoader.Line width="100%" height={20} />
                        <SkeletonLoader.Line width="80%" height={20} />
                    </View>

                    {/* Answer Cards Skeleton */}
                    <View style={{ marginBottom: Spacing.md }}>
                        <GlassCard style={styles.answerCard}>
                            <View style={styles.cardHeader}>
                                <SkeletonLoader.Base width={8} height={8} borderRadius={4} />
                                <SkeletonLoader.Line width={80} height={14} style={{ marginBottom: 0 }} />
                            </View>
                            <SkeletonLoader.Line width="90%" height={16} />
                            <SkeletonLoader.Line width="60%" height={16} />
                        </GlassCard>
                    </View>

                    <View style={{ marginBottom: Spacing.xl }}>
                        <GlassCard style={styles.answerCard}>
                            <View style={styles.cardHeader}>
                                <SkeletonLoader.Base width={8} height={8} borderRadius={4} />
                                <SkeletonLoader.Line width={100} height={14} style={{ marginBottom: 0 }} />
                            </View>
                            <SkeletonLoader.Line width="95%" height={16} />
                            <SkeletonLoader.Line width="75%" height={16} />
                        </GlassCard>
                    </View>

                    {/* Streak Banner Skeleton */}
                    <SkeletonLoader.Base width="100%" height={80} borderRadius={Radius.lg} />
                </View>
            </GradientBackground>
        );
    }

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
                        "{questionText}"
                    </Text>
                </Animated.View>

                {/* Answer Cards — stacked vertically */}
                <Animated.View entering={FadeInUp.delay(800).duration(800)} style={styles.cardWrapper}>
                    <GlassCard style={styles.answerCard}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardDot, { backgroundColor: Colors.lavender }]} />
                            <Text style={styles.cardLabel}>You Said</Text>
                        </View>
                        <Text style={styles.answerText}>{myAnswer}</Text>
                    </GlassCard>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(1000).duration(800)} style={styles.cardWrapper}>
                    <GlassCard style={styles.answerCard}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardDot, { backgroundColor: Colors.softPink }]} />
                            <Text style={styles.cardLabel}>{partnerName} Said</Text>
                        </View>
                        <Text style={styles.answerText}>{partnerAnswer}</Text>
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
        paddingTop: 130,
        paddingBottom: 40,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        ...Typography.body,
        color: Colors.textSecondary,
        marginTop: Spacing.md,
    },
    burstContainer: {
        position: 'absolute',
        top: 60,
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
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
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
    backButton: {
        width: '100%',
        marginTop: Spacing.md,
    },
    bottomSpacer: {
        height: 20,
    },
});
