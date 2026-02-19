import { Colors } from '@/constants/theme';
import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Star colors ──────────────────────────────────────
const STAR_PALETTE = [
    '#FFFFFF',
    '#E8D5F5',
    '#B8E0F7',
    '#F5D08A',
    '#C77DB8',
    '#B8A9E8',
    '#FFDDE1',
];

const STREAK_STAR_COLORS = [
    '#FFFFFF',
    Colors.lavender,
    Colors.goldSparkle,
    Colors.softPink,
    '#E8D5F5',
    '#B8E0F7',
];

interface StarData {
    x: number;
    y: number;
    size: number;
    color: string;
    opacity: number;
}

// Deterministic seeded random
function seededRand(seed: number): number {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
}

// ─── Generate static star positions ───────────────────
const generateAmbientStars = (): { far: StarData[]; mid: StarData[]; near: StarData[] } => {
    let seed = 42;

    const far: StarData[] = [];
    for (let i = 0; i < 80; i++) {
        seed++;
        far.push({
            x: seededRand(seed) * SCREEN_W,
            y: seededRand(seed + 100) * SCREEN_H,
            size: 0.8 + seededRand(seed + 200) * 1.2,
            color: '#FFFFFF',
            opacity: 0.2,
        });
    }

    const mid: StarData[] = [];
    for (let i = 0; i < 50; i++) {
        seed++;
        const colorIdx = Math.floor(seededRand(seed + 500) * STAR_PALETTE.length);
        mid.push({
            x: seededRand(seed) * SCREEN_W,
            y: seededRand(seed + 100) * SCREEN_H,
            size: 1.5 + seededRand(seed + 200) * 1.5,
            color: STAR_PALETTE[colorIdx],
            opacity: 0.35,
        });
    }

    const near: StarData[] = [];
    for (let i = 0; i < 25; i++) {
        seed++;
        const colorIdx = Math.floor(seededRand(seed + 500) * STAR_PALETTE.length);
        near.push({
            x: seededRand(seed) * SCREEN_W,
            y: seededRand(seed + 100) * SCREEN_H,
            size: 2.5 + seededRand(seed + 200) * 2,
            color: STAR_PALETTE[colorIdx],
            opacity: 0.55,
        });
    }

    return { far, mid, near };
};

// Pre-generate ambient stars once at module level (never re-created)
const AMBIENT_STARS = generateAmbientStars();

// ─── Batched Animated Layer ────────────────────────────
// One Animated.View per group — runs entirely on the UI thread.
// All stars in the group share the same opacity animation.
interface StarLayerProps {
    stars: StarData[];
    minOpacity: number;
    maxOpacity: number;
    duration: number;
    delay: number;
}

const StarLayer: React.FC<StarLayerProps> = ({ stars, minOpacity, maxOpacity, duration, delay }) => {
    // Single shared value for the entire layer — UI thread only
    const opacity = useSharedValue(minOpacity);

    React.useEffect(() => {
        opacity.value = withDelay(
            delay,
            withRepeat(
                withTiming(maxOpacity, { duration, easing: Easing.inOut(Easing.ease) }),
                -1,
                true,
            ),
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[StyleSheet.absoluteFill, animStyle]} pointerEvents="none">
            {stars.map((star, i) => (
                <View
                    key={i}
                    style={{
                        position: 'absolute',
                        left: star.x,
                        top: star.y,
                        width: star.size,
                        height: star.size,
                        borderRadius: star.size / 2,
                        backgroundColor: star.color,
                        opacity: star.opacity,
                    }}
                />
            ))}
        </Animated.View>
    );
};

// ─── Streak Stars Layer ────────────────────────────────
const generateStreakStars = (streakCount: number): StarData[] => {
    const count = Math.min(streakCount, 120);
    const stars: StarData[] = [];
    for (let i = 0; i < count; i++) {
        const seed = i + 1000;
        const colorIdx = Math.floor(seededRand(seed + 300) * STREAK_STAR_COLORS.length);
        const starSize = 1.2 + seededRand(seed + 200) * 2.8;
        stars.push({
            x: seededRand(seed) * SCREEN_W,
            y: seededRand(seed + 100) * SCREEN_H,
            size: starSize,
            color: STREAK_STAR_COLORS[colorIdx],
            opacity: 0.25 + seededRand(seed + 600) * 0.35,
        });
    }
    return stars;
};

// ─── Main Component ───────────────────────────────────
interface Props {
    streakCount?: number;
}

export default function StarBackground({ streakCount = 0 }: Props) {
    const streakStars = useMemo(() => generateStreakStars(streakCount), [streakCount]);

    return (
        <View style={styles.container} pointerEvents="none">
            {/* Far stars — slow, dim shimmer */}
            <StarLayer
                stars={AMBIENT_STARS.far}
                minOpacity={0.6}
                maxOpacity={1.0}
                duration={5000}
                delay={0}
            />
            {/* Mid stars — medium shimmer */}
            <StarLayer
                stars={AMBIENT_STARS.mid}
                minOpacity={0.5}
                maxOpacity={1.0}
                duration={3500}
                delay={800}
            />
            {/* Near stars — brighter, faster shimmer */}
            <StarLayer
                stars={AMBIENT_STARS.near}
                minOpacity={0.4}
                maxOpacity={1.0}
                duration={2500}
                delay={400}
            />
            {/* Streak stars — static, no animation needed */}
            {streakStars.length > 0 && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    {streakStars.map((star, i) => (
                        <View
                            key={i}
                            style={{
                                position: 'absolute',
                                left: star.x,
                                top: star.y,
                                width: star.size,
                                height: star.size,
                                borderRadius: star.size / 2,
                                backgroundColor: star.color,
                                opacity: star.opacity,
                            }}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
});
