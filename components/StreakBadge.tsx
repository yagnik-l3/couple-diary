import { Gradients, Shadows, Typography } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
    count: number;
    size?: 'sm' | 'md' | 'lg';
}

const sizes = {
    sm: { badge: 28, icon: 14, text: 12 },
    md: { badge: 36, icon: 18, text: 14 },
    lg: { badge: 48, icon: 24, text: 18 },
};

export default function StreakBadge({ count, size = 'md' }: Props) {
    const s = sizes[size];
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={Gradients.streakBanner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.badge, { height: s.badge, paddingHorizontal: s.badge * 0.4, borderRadius: s.badge / 2 }]}
            >
                <Text style={{ fontSize: s.icon }}>🔥</Text>
                <Text style={[styles.text, { fontSize: s.text }]}>{count}</Text>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        ...Shadows.soft,
    },
    text: {
        ...Typography.bodySemiBold,
        color: '#FFF',
    },
});
