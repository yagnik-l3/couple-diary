import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

interface Props {
    children: React.ReactNode;
    style?: ViewStyle;
    intensity?: number;
}

export default function GlassCard({ children, style, intensity = 30 }: Props) {
    if (Platform.OS === 'web') {
        return (
            <View style={[styles.fallback, style]}>
                {children}
            </View>
        );
    }

    return (
        <BlurView intensity={intensity} tint="dark" style={[styles.card, style]}>
            {children}
        </BlurView>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        ...Shadows.soft,
    },
    fallback: {
        backgroundColor: 'rgba(30, 25, 60, 0.75)',
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        ...Shadows.soft,
    },
});
