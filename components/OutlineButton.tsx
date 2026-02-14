import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

interface Props {
    title: string;
    onPress: () => void;
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
    icon?: React.ReactNode;
}

export default function OutlineButton({
    title,
    onPress,
    style,
    textStyle,
    disabled = false,
    icon,
}: Props) {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
            style={[styles.button, disabled && styles.disabled, style]}
        >
            {icon}
            <Text style={[styles.text, textStyle]}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md - 2,
        paddingHorizontal: Spacing.xl,
        borderRadius: Radius.xl,
        borderWidth: 1.5,
        borderColor: Colors.white30,
        gap: Spacing.sm,
    },
    text: {
        ...Typography.bodyMedium,
        fontSize: 15,
        color: Colors.textPrimary,
    },
    disabled: {
        opacity: 0.4,
    },
});
