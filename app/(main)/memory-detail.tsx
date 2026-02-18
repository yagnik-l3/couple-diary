import FloatingCard from '@/components/FloatingCard';
import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { s } from '@/utils/scale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

// This mock data mirrors timeline.tsx — in a real app this would come from a shared store
const MOCK_MEMORIES: Record<string, {
    day: number;
    date: string;
    question: string;
    myAnswer: string;
    partnerAnswer: string;
}> = {
    '1': {
        day: 12, date: 'Feb 12, 2026',
        question: "What's one small thing your partner does that always makes you smile?",
        myAnswer: "When they leave little notes around the house.",
        partnerAnswer: "The way they hum while cooking dinner.",
    },
    '2': {
        day: 11, date: 'Feb 11, 2026',
        question: "What moment from your first date do you remember most?",
        myAnswer: "The way the sunset reflected in your eyes.",
        partnerAnswer: "When we both ordered the same dish and laughed.",
    },
    '3': {
        day: 10, date: 'Feb 10, 2026',
        question: "If you could relive one day together, which would it be?",
        myAnswer: "Our road trip to the mountains last summer.",
        partnerAnswer: "The rainy day we spent cooking and dancing in the kitchen.",
    },
    '4': {
        day: 9, date: 'Feb 9, 2026',
        question: "What's a dream you want to achieve together?",
        myAnswer: "Travel the world and see the Northern Lights.",
        partnerAnswer: "Build a cozy home with a garden full of sunflowers.",
    },
    '5': {
        day: 8, date: 'Feb 8, 2026',
        question: "What song reminds you of your partner?",
        myAnswer: "Can't Help Falling In Love – Elvis",
        partnerAnswer: "Perfect – Ed Sheeran",
    },
};

export default function MemoryDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const memory = MOCK_MEMORIES[id ?? '1'];

    if (!memory) {
        return (
            <GradientBackground>
                <View style={styles.center}>
                    <Text style={styles.errorText}>Memory not found</Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backLink}>← Go Back</Text>
                    </TouchableOpacity>
                </View>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground>
            <StarBackground />
            <View style={styles.container}>
                {/* Header */}
                <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <View style={styles.dayBadge}>
                        <Text style={styles.dayBadgeText}>Day {memory.day}</Text>
                    </View>
                    <Text style={styles.dateText}>{memory.date}</Text>
                </Animated.View>

                {/* Question */}
                <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.questionSection}>
                    <Text style={styles.questionLabel}>Today's Question ✨</Text>
                    <FloatingCard style={styles.questionCard}>
                        <Text style={styles.questionText}>{memory.question}</Text>
                    </FloatingCard>
                </Animated.View>

                {/* Answers */}
                <View style={styles.answersSection}>
                    {/* My Answer */}
                    <Animated.View entering={FadeInDown.delay(500).duration(600).springify()}>
                        <FloatingCard style={styles.answerCard}>
                            <View style={styles.answerHeader}>
                                <View style={[styles.answerDot, { backgroundColor: Colors.lavender }]} />
                                <Text style={styles.answerLabel}>Your Answer</Text>
                            </View>
                            <Text style={styles.answerText}>{memory.myAnswer}</Text>
                        </FloatingCard>
                    </Animated.View>

                    {/* Divider */}
                    <Animated.View entering={FadeIn.delay(700).duration(400)} style={styles.vsDivider}>
                        <View style={styles.vsLine} />
                        <Text style={styles.vsText}>💕</Text>
                        <View style={styles.vsLine} />
                    </Animated.View>

                    {/* Partner Answer */}
                    <Animated.View entering={FadeInDown.delay(800).duration(600).springify()}>
                        <FloatingCard style={styles.answerCard}>
                            <View style={styles.answerHeader}>
                                <View style={[styles.answerDot, { backgroundColor: Colors.softPink }]} />
                                <Text style={styles.answerLabel}>Partner's Answer</Text>
                            </View>
                            <Text style={styles.answerText}>{memory.partnerAnswer}</Text>
                        </FloatingCard>
                    </Animated.View>
                </View>
            </View>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        ...Typography.heading,
        fontSize: s(20),
        marginBottom: Spacing.md,
    },
    backLink: {
        ...Typography.bodyMedium,
        color: Colors.softPink,
        fontSize: s(16),
    },

    // Header
    header: {
        paddingTop: s(60),
        paddingBottom: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    backText: {
        ...Typography.body,
        color: Colors.textSecondary,
        fontSize: 15,
    },
    dayBadge: {
        backgroundColor: 'rgba(245, 208, 138, 0.12)',
        paddingVertical: 3,
        paddingHorizontal: 12,
        borderRadius: Radius.full,
        marginLeft: 'auto',
    },
    dayBadgeText: {
        ...Typography.bodySemiBold,
        fontSize: 12,
        color: Colors.goldSparkle,
    },
    dateText: {
        ...Typography.caption,
        fontSize: 12,
        color: Colors.textMuted,
    },

    // Question
    questionSection: {
        marginBottom: Spacing.xl,
        alignItems: 'center',
    },
    questionLabel: {
        ...Typography.bodySemiBold,
        fontSize: s(14),
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
    },
    questionCard: {
        width: '100%',
        padding: Spacing.lg,
    },
    questionText: {
        ...Typography.heading,
        fontSize: s(20),
        textAlign: 'center',
        lineHeight: s(30),
    },

    // Answers
    answersSection: {
        flex: 1,
    },
    answerCard: {
        width: '100%',
        padding: Spacing.lg,
    },
    answerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    answerDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    answerLabel: {
        ...Typography.bodySemiBold,
        fontSize: s(13),
        color: Colors.textSecondary,
    },
    answerText: {
        ...Typography.body,
        fontSize: s(16),
        lineHeight: s(24),
        color: Colors.textPrimary,
    },

    // VS Divider
    vsDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing.md,
    },
    vsLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.white08,
    },
    vsText: {
        fontSize: s(20),
        marginHorizontal: Spacing.md,
    },
});
