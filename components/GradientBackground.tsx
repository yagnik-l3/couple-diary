import { Gradients } from '@/constants/theme';
import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

interface Props extends Partial<LinearGradientProps> {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    variant?: 'default' | 'full';
}

export default function GradientBackground({
    children,
    style,
    variant = 'default',
    ...rest
}: Props) {
    const colors = variant === 'full' ? Gradients.backgroundFull : Gradients.background;

    return (
        <LinearGradient colors={colors} style={[styles.container, style]} {...rest}>
            {children}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
