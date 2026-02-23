import { Colors, Radius } from '@/constants/theme';
import React, { useEffect } from 'react';
import { DimensionValue, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

interface SkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: StyleProp<ViewStyle>;
}

const SkeletonBase: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = Radius.md,
    style,
}) => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(0.7, { duration: 800 }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width: width as any, height: height as any, borderRadius },
                animatedStyle,
                style,
            ]}
        />
    );
};

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: Colors.white15,
        overflow: 'hidden',
    },
});

// ─── Preset Components ────────────────────────────────

const Avatar = ({ size = 60, style }: { size?: number; style?: ViewStyle }) => (
    <SkeletonBase width={size} height={size} borderRadius={size / 2} style={style} />
);

const Line = ({ width = '100%', height = 20, style }: SkeletonProps) => (
    <SkeletonBase width={width} height={height} style={[{ marginBottom: 8 }, style]} />
);

const Card = ({ height = 150, style }: { height?: DimensionValue; style?: ViewStyle }) => (
    <SkeletonBase width="100%" height={height} borderRadius={Radius.lg} style={style} />
);

export default {
    Base: SkeletonBase,
    Avatar,
    Line,
    Card,
};
