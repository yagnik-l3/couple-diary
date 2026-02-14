import FloatingCard from '@/components/FloatingCard';
import GlowButton from '@/components/GlowButton';
import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

const MOCK_QUESTION = "What's one small thing your partner does that always makes you smile?";

export default function QuestionScreen() {
    const router = useRouter();
    const [answer, setAnswer] = useState('');

    return (
        <GradientBackground variant="full">
            <StarBackground />
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Back */}
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>

                    {/* Category Tag */}
                    <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.tagRow}>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>💭 Daily Question</Text>
                        </View>
                        <Text style={styles.dayText}>Day 12</Text>
                    </Animated.View>

                    {/* Question Card */}
                    <Animated.View entering={FadeInUp.delay(400).duration(800)}>
                        <FloatingCard style={styles.questionCard}>
                            <Text style={styles.questionMark}>"</Text>
                            <Text style={styles.questionText}>{MOCK_QUESTION}</Text>
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
                            />
                            <View style={styles.inputFooter}>
                                <TouchableOpacity style={styles.emojiButton}>
                                    <Text style={styles.emojiIcon}>😊</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.voiceButton}>
                                    <Text style={styles.voiceIcon}>🎤</Text>
                                </TouchableOpacity>
                                <Text style={styles.charCount}>{answer.length}/500</Text>
                            </View>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(800).duration(600)}>
                        <GlowButton
                            title="Send to Universe ✨"
                            onPress={() => router.push('/(main)/waiting')}
                            disabled={answer.trim().length === 0}
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
    container: {
        flexGrow: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: 60,
        paddingBottom: Spacing.xxl,
    },
    backButton: {
        marginBottom: Spacing.lg,
    },
    backText: {
        ...Typography.body,
        color: Colors.textSecondary,
        fontSize: 15,
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
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
        gap: Spacing.sm,
    },
    emojiButton: {
        padding: 4,
    },
    emojiIcon: {
        fontSize: 22,
    },
    voiceButton: {
        padding: 4,
    },
    voiceIcon: {
        fontSize: 20,
        opacity: 0.5,
    },
    charCount: {
        ...Typography.caption,
        fontSize: 12,
        color: Colors.textMuted,
        marginLeft: 'auto',
    },
    sendButton: {
        width: '100%',
        marginTop: Spacing.lg,
    },
});
