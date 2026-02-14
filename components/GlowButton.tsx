import { Colors, Gradients, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';

interface Props {
    title: string;
    onPress: () => void;
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
}

export default function GlowButton({
    title,
    onPress,
    style,
    textStyle,
    disabled = false,
    loading = false,
    icon,
}: Props) {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            style={[styles.wrapper, disabled && styles.disabled, style]}
        >
            <LinearGradient
                colors={disabled ? Gradients.buttonSubtle : Gradients.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {loading ? (
                    <ActivityIndicator color={Colors.textPrimary} />
                ) : (
                    <>
                        {icon}
                        <Text style={[styles.text, textStyle]}>{title}</Text>
                    </>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: Radius.xl,
        ...Shadows.glow,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: Radius.xl,
        gap: Spacing.sm,
    },
    text: {
        ...Typography.bodySemiBold,
        fontSize: 16,
        color: Colors.textPrimary,
    },
    disabled: {
        opacity: 0.5,
    },
});
