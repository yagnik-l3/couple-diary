import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { s } from '@/utils/scale';
import * as Haptics from 'expo-haptics';
import * as StoreReview from 'expo-store-review';
import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';

interface RateUsModalProps {
    visible: boolean;
    onRated: () => void;
    onNever: () => void;
    onRemindLater: () => void;
}

const STARS = [1, 2, 3, 4, 5];

export default function RateUsModal({
    visible,
    onRated,
    onNever,
    onRemindLater,
}: RateUsModalProps) {
    const [selectedStars, setSelectedStars] = useState(0);

    const handleStarPress = (star: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedStars(star);
    };

    const handleRateNow = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
            const isAvailable = await StoreReview.isAvailableAsync();
            if (isAvailable) {
                await StoreReview.requestReview();
            }
        } catch {
            // Silently fail — the store review API can be unavailable in dev builds
        }
        onRated();
    };

    const handleRemindLater = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onRemindLater();
    };

    const handleNever = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onNever();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={handleRemindLater}
        >
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={handleRemindLater}>
                <Animated.View
                    entering={FadeIn.duration(300)}
                    exiting={FadeOut.duration(200)}
                    style={styles.backdrop}
                />
            </TouchableWithoutFeedback>

            {/* Card */}
            <Animated.View
                entering={FadeInUp.delay(50).duration(400).springify()}
                style={styles.cardWrapper}
            >
                <View style={styles.card}>
                    {/* Emoji */}
                    <Text style={styles.emoji}>💫</Text>

                    {/* Title */}
                    <Text style={styles.title}>Loving the journey?</Text>
                    <Text style={styles.subtitle}>
                        A quick rating helps other couples find us — it only takes 2 seconds!
                    </Text>

                    {/* Stars */}
                    <View style={styles.starsRow}>
                        {STARS.map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => handleStarPress(star)}
                                activeOpacity={0.7}
                                style={styles.starButton}
                            >
                                <Text style={[
                                    styles.star,
                                    star <= selectedStars && styles.starSelected,
                                ]}>
                                    {star <= selectedStars ? '★' : '☆'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Rate Now */}
                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            selectedStars === 0 && styles.primaryButtonDisabled,
                        ]}
                        onPress={handleRateNow}
                        disabled={selectedStars === 0}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.primaryButtonText}>
                            {selectedStars === 0 ? 'Tap a star first ✨' : 'Rate Us Now ✨'}
                        </Text>
                    </TouchableOpacity>

                    {/* Secondary actions */}
                    <View style={styles.secondaryRow}>
                        <TouchableOpacity
                            onPress={handleRemindLater}
                            style={styles.secondaryButton}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.secondaryText}>Remind me later</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity
                            onPress={handleNever}
                            style={styles.secondaryButton}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.secondaryText, styles.neverText]}>No thanks</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
    },
    cardWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.md,
        paddingBottom: s(36),
    },
    card: {
        backgroundColor: '#1A1740',
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        padding: Spacing.xl,
        alignItems: 'center',
    },
    emoji: {
        fontSize: s(44),
        marginBottom: Spacing.sm,
    },
    title: {
        ...Typography.heading,
        fontSize: s(22),
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: s(21),
        marginBottom: Spacing.lg,
    },
    starsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s(8),
        marginBottom: Spacing.lg,
    },
    starButton: {
        padding: s(4),
    },
    star: {
        fontSize: s(36),
        color: Colors.textMuted,
    },
    starSelected: {
        color: Colors.goldSparkle,
    },
    primaryButton: {
        width: '100%',
        backgroundColor: '#6C3DB8',
        borderRadius: Radius.full,
        paddingVertical: s(14),
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    primaryButtonDisabled: {
        backgroundColor: Colors.white08,
    },
    primaryButtonText: {
        ...Typography.bodySemiBold,
        fontSize: s(15),
        color: Colors.textPrimary,
    },
    secondaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    secondaryButton: {
        paddingVertical: s(6),
        paddingHorizontal: Spacing.sm,
    },
    secondaryText: {
        ...Typography.body,
        fontSize: s(13),
        color: Colors.textSecondary,
    },
    neverText: {
        color: Colors.textMuted,
    },
    divider: {
        width: 1,
        height: s(14),
        backgroundColor: Colors.glassBorder,
    },
});
