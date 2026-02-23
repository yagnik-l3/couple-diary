import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
    FadeInUp,
    FadeOutUp
} from 'react-native-reanimated';

interface InlineToastProps {
    message: string;
    visible: boolean;
    type?: 'success' | 'error' | 'info';
    /** Auto-dismiss after ms (0 = never). Default: 3000 */
    duration?: number;
    onHide?: () => void;
}

const TYPE_CONFIG = {
    success: { bg: 'rgba(110, 203, 138, 0.15)', border: 'rgba(110, 203, 138, 0.4)', icon: '✅', textColor: '#6ECB8A' },
    error: { bg: 'rgba(255, 100, 100, 0.15)', border: 'rgba(255, 100, 100, 0.4)', icon: '❌', textColor: '#FF6464' },
    info: { bg: 'rgba(108, 99, 255, 0.15)', border: 'rgba(108, 99, 255, 0.4)', icon: 'ℹ️', textColor: Colors.lavender },
};

export default function InlineToast({
    message,
    visible,
    type = 'info',
    duration = 3000,
    onHide,
}: InlineToastProps) {
    const config = TYPE_CONFIG[type];

    useEffect(() => {
        if (visible && duration > 0) {
            const timer = setTimeout(() => {
                onHide?.();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [visible, duration, onHide]);

    if (!visible) return null;

    return (
        <Animated.View
            entering={FadeInUp.duration(300)}
            exiting={FadeOutUp.duration(250)}
            style={[
                styles.container,
                { backgroundColor: config.bg, borderColor: config.border },
            ]}
        >
            <Text style={styles.icon}>{config.icon}</Text>
            <Text style={[styles.message, { color: config.textColor }]}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.lg,
        borderWidth: 1,
        marginVertical: Spacing.sm,
    },
    icon: {
        fontSize: 16,
    },
    message: {
        ...Typography.bodyMedium,
        fontSize: 14,
        flex: 1,
    },
});
