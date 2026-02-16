import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface Props {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

export default function FloatingCard({ children, style }: Props) {
    return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.cardBg,
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        ...Shadows.soft,
    },
});
