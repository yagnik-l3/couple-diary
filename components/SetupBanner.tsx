import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { s } from '@/utils/scale';
import { useAppState } from '@/utils/store';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';

export default function SetupBanner() {
    const router = useRouter();
    const { state } = useAppState();

    // Only show if missing key details
    const isMissingDetails = !state.relationshipDate || state.topicPreferences.length < 3 || !state.coupleVibe;
    if (!isMissingDetails) return null;

    // Check if current user is the editor, or if no editor is assigned yet
    const isEditor = !state.coupleEditorId || state.coupleEditorId === state.userId;

    // If someone else is already the editor, hide the banner entirely (they handle setup)
    if (!isEditor) return null;


    const handlePress = () => {
        if (!isEditor) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/couple-setup');
    };

    return (
        <Animated.View
            entering={FadeInUp.delay(400).duration(600)}
            exiting={FadeOut}
            style={styles.container}
        >
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={isEditor ? 0.9 : 1}
                disabled={!isEditor}
                style={styles.banner}
            >
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{isEditor ? '💝' : '⏳'}</Text>
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>
                        {isEditor ? 'Complete Your Profile' : 'Setting up the Universe'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {isEditor
                            ? 'Add your relationship date and preferences to unlock all features ✨'
                            : `Waiting for ${state.partnerName || 'your partner'} to finish the setup...`}
                    </Text>
                </View>
                {isEditor && (
                    <Text style={styles.arrow}>›</Text>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: Spacing.sm,
        marginBottom: Spacing.md,
        zIndex: 15,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: Radius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    iconContainer: {
        width: s(44),
        height: s(44),
        borderRadius: s(22),
        backgroundColor: 'rgba(199, 125, 184, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    icon: {
        fontSize: s(24),
    },
    textContainer: {
        flex: 1,
    },
    title: {
        ...Typography.bodySemiBold,
        fontSize: s(16),
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    subtitle: {
        ...Typography.caption,
        fontSize: s(13),
        color: Colors.textSecondary,
        lineHeight: s(18),
    },
    arrow: {
        fontSize: s(28),
        color: Colors.textMuted,
        marginLeft: Spacing.sm,
    },
});
