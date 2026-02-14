import { Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { ms } from '@/utils/scale';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface LivesBadgeProps {
    count: number;
    size?: 'sm' | 'md';
}

export default function LivesBadge({ count, size = 'md' }: LivesBadgeProps) {
    const isSm = size === 'sm';

    return (
        <View style={[styles.badge, isSm && styles.badgeSm]}>
            <Text style={[styles.heart, isSm && styles.heartSm]}>❤️</Text>
            <Text style={[styles.count, isSm && styles.countSm]}>{count}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(232, 106, 106, 0.15)',
        paddingVertical: Spacing.xs + 2,
        paddingHorizontal: Spacing.sm + 4,
        borderRadius: 999,
        gap: ms(4),
        ...Shadows.soft,
    },
    badgeSm: {
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
    },
    heart: {
        fontSize: ms(16),
    },
    heartSm: {
        fontSize: ms(12),
    },
    count: {
        ...Typography.bodySemiBold,
        fontSize: ms(15),
        color: Colors.rosePink,
    },
    countSm: {
        fontSize: ms(12),
    },
});
