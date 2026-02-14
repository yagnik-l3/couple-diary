import { Colors } from '@/constants/theme';
import React, { useEffect, useMemo } from 'react';
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

// ─── Star colors for cosmic variety ───────────────────
const STAR_PALETTE = [
    '#FFFFFF',      // pure white
    '#E8D5F5',      // soft lavender
    '#B8E0F7',      // cool blue
    '#F5D08A',      // warm gold
    '#C77DB8',      // soft pink
    '#B8A9E8',      // lavender accent
    '#FFDDE1',      // rose white
];

// ─── Same palette used for streak stars inside galaxy ─
const STREAK_STAR_COLORS = [
    '#FFFFFF',
    Colors.lavender,
    Colors.goldSparkle,
    Colors.softPink,
    '#E8D5F5',
    '#B8E0F7',
];

interface Star {
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
    color: string;
    minOpacity: number;
    maxOpacity: number;
}

// Deterministic seeded random
function seededRand(seed: number): number {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
}

// ─── Static ambient background stars ─────────────────
const generateAmbientStars = (): Star[] => {
    const stars: Star[] = [];
    let seed = 42;

    // Far stars (80 tiny dim stars)
    for (let i = 0; i < 80; i++) {
        seed++;
        stars.push({
            x: seededRand(seed) * SCREEN_W,
            y: seededRand(seed + 100) * SCREEN_H,
            size: 0.8 + seededRand(seed + 200) * 1.2,
            delay: seededRand(seed + 300) * 5000,
            duration: 3000 + seededRand(seed + 400) * 4000,
            color: '#FFFFFF',
            minOpacity: 0.1,
            maxOpacity: 0.35,
        });
    }

    // Mid stars (50 small colored stars)
    for (let i = 0; i < 50; i++) {
        seed++;
        const colorIdx = Math.floor(seededRand(seed + 500) * STAR_PALETTE.length);
        stars.push({
            x: seededRand(seed) * SCREEN_W,
            y: seededRand(seed + 100) * SCREEN_H,
            size: 1.5 + seededRand(seed + 200) * 1.5,
            delay: seededRand(seed + 300) * 4000,
            duration: 2000 + seededRand(seed + 400) * 3000,
            color: STAR_PALETTE[colorIdx],
            minOpacity: 0.15,
            maxOpacity: 0.6,
        });
    }

    // Near stars (25 prominent sparkle stars)
    for (let i = 0; i < 25; i++) {
        seed++;
        const colorIdx = Math.floor(seededRand(seed + 500) * STAR_PALETTE.length);
        stars.push({
            x: seededRand(seed) * SCREEN_W,
            y: seededRand(seed + 100) * SCREEN_H,
            size: 2.5 + seededRand(seed + 200) * 2,
            delay: seededRand(seed + 300) * 3000,
            duration: 1500 + seededRand(seed + 400) * 2500,
            color: STAR_PALETTE[colorIdx],
            minOpacity: 0.2,
            maxOpacity: 0.85,
        });
    }

    return stars;
};

// ─── Streak-based stars spread across the screen ──────
// These mirror the galaxy stars but are placed around the full background
const generateStreakStars = (streakCount: number): Star[] => {
    const count = Math.min(streakCount, 120); // up to 120 background streak stars
    const stars: Star[] = [];

    for (let i = 0; i < count; i++) {
        const seed = i + 1000; // offset seed so positions differ from galaxy & ambient stars
        const colorIdx = Math.floor(seededRand(seed + 300) * STREAK_STAR_COLORS.length);
        const starSize = 1.2 + seededRand(seed + 200) * 2.8; // 1.2–4px
        stars.push({
            x: seededRand(seed) * SCREEN_W,
            y: seededRand(seed + 100) * SCREEN_H,
            size: starSize,
            delay: seededRand(seed + 400) * 4000,
            duration: 2000 + seededRand(seed + 500) * 3000,
            color: STREAK_STAR_COLORS[colorIdx],
            minOpacity: 0.15 + seededRand(seed + 600) * 0.15,
            maxOpacity: 0.5 + seededRand(seed + 700) * 0.4,
        });
    }

    return stars;
};

// ─── Animated star dot ────────────────────────────────
const StarDot: React.FC<{ star: Star }> = ({ star }) => {
    const opacity = useSharedValue(star.minOpacity);

    useEffect(() => {
        opacity.value = withDelay(
            star.delay,
            withRepeat(
                withTiming(star.maxOpacity, {
                    duration: star.duration,
                    easing: Easing.inOut(Easing.ease),
                }),
                -1,
                true,
            ),
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.star,
                {
                    left: star.x,
                    top: star.y,
                    width: star.size,
                    height: star.size,
                    borderRadius: star.size / 2,
                    backgroundColor: star.color,
                },
                animStyle,
            ]}
        />
    );
};

// Ambient stars are static — generated once
const ambientStars = generateAmbientStars();

interface Props {
    streakCount?: number;
}

export default function StarBackground({ streakCount = 0 }: Props) {
    // Streak stars are memoized — regenerate only when streak changes
    const streakStars = useMemo(
        () => generateStreakStars(streakCount),
        [streakCount],
    );

    return (
        <View style={styles.container} pointerEvents="none">
            {/* Ambient base layer */}
            {ambientStars.map((star, i) => (
                <StarDot key={`a-${i}`} star={star} />
            ))}
            {/* Streak-driven stars — grow with your journey */}
            {streakStars.map((star, i) => (
                <StarDot key={`s-${i}`} star={star} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    star: {
        position: 'absolute',
    },
});
