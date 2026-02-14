import AvatarMerge from '@/components/AvatarMerge';
import GlowButton from '@/components/GlowButton';
import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { ms, vs } from '@/utils/scale';
import { useAppState } from '@/utils/store';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

export default function ConnectedScreen() {
    const router = useRouter();
    const { update } = useAppState();
    const params = useLocalSearchParams<{
        name: string;
        email: string;
        gender: string;
        topics: string;
        inviteCode: string;
    }>();

    const handleStartJourney = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        update({
            userEmail: params.email || '',
            userName: params.name || '',
            userGender: (params.gender as any) || '',
            topicPreferences: params.topics ? params.topics.split(',') : [],
            hasCompletedOnboarding: true,
            hasPartner: true,
        });
        router.replace('/(main)/home');
    };

    return (
        <GradientBackground>
            <StarBackground />
            <View style={styles.container}>
                <View style={styles.contentArea}>
                    <Animated.View entering={FadeInUp.duration(600)} style={styles.content}>
                        <Animated.Text entering={FadeIn.delay(200).duration(600)} style={styles.emoji}>
                            💫
                        </Animated.Text>
                        <AvatarMerge size={ms(80)} />
                        <Animated.Text
                            entering={FadeInUp.delay(400).duration(500)}
                            style={styles.title}
                        >
                            You're Connected!
                        </Animated.Text>
                        <Animated.Text
                            entering={FadeInUp.delay(600).duration(500)}
                            style={styles.subtitle}
                        >
                            {params.name || 'You'} & Partner{"\n"}Your universe for two is ready ✨
                        </Animated.Text>
                        {/* <Animated.View entering={FadeIn.delay(900).duration(400)} style={styles.badge}>
                            <Text style={styles.badgeText}>
                                🔗 Paired with code {(params.inviteCode || '').substring(0, 4)}…
                            </Text>
                        </Animated.View> */}
                    </Animated.View>
                </View>

                <Animated.View
                    entering={FadeInUp.delay(1000).duration(500)}
                    style={styles.bottomContainer}
                >
                    <GlowButton
                        title="Start Journey ✨"
                        onPress={handleStartJourney}
                        style={styles.button}
                    />
                </Animated.View>
            </View>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: vs(60),
    },
    contentArea: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
    },
    content: {
        alignItems: 'center',
    },
    emoji: {
        fontSize: ms(48),
        marginBottom: Spacing.lg,
    },
    title: {
        ...Typography.heading,
        fontSize: ms(34),
        textAlign: 'center',
        lineHeight: ms(44),
        marginTop: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    subtitle: {
        ...Typography.body,
        fontSize: ms(16),
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: ms(24),
    },
    badge: {
        backgroundColor: 'rgba(199, 125, 184, 0.12)',
        borderRadius: Radius.full,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.xl,
    },
    badgeText: {
        ...Typography.caption,
        fontSize: ms(12),
        color: Colors.softPink,
    },
    bottomContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: vs(40),
        alignItems: 'center',
    },
    button: {
        width: '100%',
    },
});
