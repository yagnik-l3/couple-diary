import { Shadows } from '@/constants/theme';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
    Easing,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

interface Props {
    value: boolean;
    onToggle: (newVal: boolean) => void;
    disabled?: boolean;
}

export default function ToggleSwitch({ value, onToggle, disabled = false }: Props) {
    const progress = useSharedValue(value ? 1 : 0);

    React.useEffect(() => {
        progress.value = withTiming(value ? 1 : 0, {
            duration: 300,
            easing: Easing.inOut(Easing.ease),
        });
    }, [value]);

    const trackStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            progress.value,
            [0, 1],
            ['rgba(255,255,255,0.12)', '#6C3DB8']
        );
        return { backgroundColor };
    });

    const thumbStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: progress.value * 20 }],
    }));

    return (
        <TouchableOpacity
            onPress={() => !disabled && onToggle(!value)}
            activeOpacity={0.8}
            disabled={disabled}
        >
            <Animated.View style={[styles.track, trackStyle, disabled && styles.disabled]}>
                <Animated.View style={[styles.thumb, thumbStyle]} />
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    track: {
        width: 48,
        height: 28,
        borderRadius: 14,
        padding: 3,
        justifyContent: 'center',
    },
    thumb: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#FFF',
        ...Shadows.soft,
    },
    disabled: {
        opacity: 0.4,
    },
});
