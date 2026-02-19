import FloatingCard from '@/components/FloatingCard';
import GlowButton from '@/components/GlowButton';
import GradientBackground from '@/components/GradientBackground';
import SkeletonLoader from '@/components/SkeletonLoader';
import StarBackground from '@/components/StarBackground';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { QuestionService } from '@/utils/questionService';
import { useAppState } from '@/utils/store';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

export default function QuestionScreen() {
    const router = useRouter();
    const { state } = useAppState();
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [question, setQuestion] = useState<{ text: string; category: string; daily_id: string } | null>(null);
    const [error, setError] = useState('');

    // Fetch today's question on mount
    useEffect(() => {
        (async () => {
            try {
                const q = await QuestionService.getTodayQuestion();
                if (!q) {
                    setError('No question available yet');
                    return;
                }
                setQuestion({ text: q.text, category: q.category, daily_id: q.daily_id });
            } catch (err: any) {
                setError(err.message || 'Failed to load question');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSubmit = async () => {
        if (!answer.trim() || !question) return;
        setSubmitting(true);
        try {
            await QuestionService.submitAnswer(question.daily_id, answer);
            router.replace({ pathname: '/(main)/waiting', params: { daily_id: question.daily_id } } as any);
        } catch (err: any) {
            alert(err.message || 'Failed to submit');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <GradientBackground variant="full">
                <StarBackground />
                <View style={styles.container}>
                    {/* Back Button Skeleton */}
                    <SkeletonLoader.Line width={60} height={20} style={{ marginBottom: Spacing.lg }} />

                    {/* Tag Row Skeleton */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
                        <SkeletonLoader.Base width={120} height={34} borderRadius={Radius.full} />
                        <SkeletonLoader.Line width={60} height={14} style={{ marginBottom: 0 }} />
                    </View>

                    {/* Question Card Skeleton */}
                    <View style={{ marginBottom: Spacing.xl }}>
                        <FloatingCard style={[styles.questionCard, { paddingVertical: Spacing.xl }]}>
                            <SkeletonLoader.Base width={40} height={40} borderRadius={20} style={{ marginBottom: Spacing.md, opacity: 0.5 }} />
                            <SkeletonLoader.Line width="90%" height={24} />
                            <SkeletonLoader.Line width="70%" height={24} />
                            <SkeletonLoader.Base width={40} height={40} borderRadius={20} style={{ marginTop: Spacing.md, opacity: 0.5 }} />
                        </FloatingCard>
                    </View>

                    {/* Answer Input Skeleton */}
                    <View style={{ marginBottom: Spacing.xl }}>
                        <SkeletonLoader.Line width={100} height={16} style={{ marginBottom: Spacing.sm }} />
                        <SkeletonLoader.Base width="100%" height={160} borderRadius={Radius.lg} />
                    </View>

                    {/* Button Skeleton */}
                    <SkeletonLoader.Base width="100%" height={56} borderRadius={Radius.full} />
                </View>
            </GradientBackground>
        );
    }

    if (error) {
        return (
            <GradientBackground variant="full">
                <StarBackground />
                <View style={styles.centered}>
                    <Text style={styles.errorEmoji}>😕</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <GlowButton title="Invite Your Partner" onPress={() => router.push('/(main)/invite')} style={{ marginTop: Spacing.lg }} />
                </View>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground variant="full">
            <StarBackground />
            {/* Back */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <View style={styles.tag}>
                    <Text style={styles.tagText}>💭 {question?.category || 'Daily Question'}</Text>
                </View>
                <Text style={styles.dayText}>Day {state.streakCount}</Text>
            </View>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                >

                    {/* Category Tag */}
                    <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.tagRow}>
                    </Animated.View>

                    {/* Question Card */}
                    <Animated.View entering={FadeInUp.delay(400).duration(800)}>
                        <FloatingCard style={styles.questionCard}>
                            <Text style={styles.questionMark}>"</Text>
                            <Text style={styles.questionText}>{question?.text}</Text>
                            <Text style={styles.questionMarkEnd}>"</Text>
                        </FloatingCard>
                    </Animated.View>

                    {/* Answer Input */}
                    <Animated.View entering={FadeInUp.delay(600).duration(800)} style={styles.answerSection}>
                        <Text style={styles.answerLabel}>Your thoughts...</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.textArea}
                                value={answer}
                                onChangeText={setAnswer}
                                placeholder="Write from your heart..."
                                placeholderTextColor={Colors.textMuted}
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                                maxLength={500}
                            />
                            <View style={styles.inputFooter}>
                                <Text style={styles.charCount}>{answer.length}/500</Text>
                            </View>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(800).duration(600)}>
                        <GlowButton
                            title={submitting ? "Sending..." : "Send to Universe ✨"}
                            onPress={handleSubmit}
                            disabled={answer.trim().length === 0 || submitting}
                            style={styles.sendButton}
                        />
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: Spacing.lg,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    loadingText: {
        ...Typography.body,
        color: Colors.textSecondary,
        marginTop: Spacing.md,
    },
    errorEmoji: {
        fontSize: 48,
        marginBottom: Spacing.md,
    },
    errorText: {
        ...Typography.body,
        color: Colors.textSecondary,
        textAlign: 'center',
        fontSize: 15,
    },
    backButton: {
        // marginBottom: Spacing.lg,
    },
    backText: {
        ...Typography.body,
        color: Colors.textSecondary,
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.lg,
    },
    tag: {
        backgroundColor: Colors.white08,
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
    },
    tagText: {
        ...Typography.bodyMedium,
        fontSize: 13,
        color: Colors.lavender,
    },
    dayText: {
        ...Typography.caption,
        color: Colors.textMuted,
    },
    questionCard: {
        paddingVertical: Spacing.xl,
        paddingHorizontal: Spacing.lg,
        alignItems: 'center',
    },
    questionMark: {
        ...Typography.heading,
        fontSize: 48,
        color: Colors.softPink,
        opacity: 0.5,
        lineHeight: 48,
    },
    questionText: {
        ...Typography.heading,
        fontSize: 22,
        textAlign: 'center',
        lineHeight: 32,
        marginVertical: Spacing.md,
    },
    questionMarkEnd: {
        ...Typography.heading,
        fontSize: 48,
        color: Colors.softPink,
        opacity: 0.5,
        lineHeight: 48,
    },
    answerSection: {
        marginTop: Spacing.xl,
    },
    answerLabel: {
        ...Typography.bodyMedium,
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        marginLeft: 4,
    },
    inputWrapper: {
        backgroundColor: Colors.inputBg,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.inputBorder,
        overflow: 'hidden',
    },
    textArea: {
        ...Typography.body,
        fontSize: 15,
        color: Colors.textPrimary,
        padding: Spacing.md,
        minHeight: 120,
    },
    inputFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    charCount: {
        ...Typography.caption,
        fontSize: 12,
        color: Colors.textMuted,
    },
    sendButton: {
        width: '100%',
        marginTop: Spacing.lg,
    },
});
