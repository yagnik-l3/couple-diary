import { getLevelForStreak } from '@/constants/levels';
import { Colors, Shadows } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

interface Props {
    size?: number;
    streakCount?: number; // actual day count — drives everything
}

// ─── Deterministic pseudo-random ──────────────────────
// Produces a stable value for each star index so they don't jump around
function seededRandom(seed: number): number {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
}

// ─── Star colors palette ──────────────────────────────
const STAR_COLORS = [
    '#FFFFFF',
    Colors.lavender,
    Colors.goldSparkle,
    Colors.softPink,
    '#E8D5F5',
    '#B8E0F7',
];

// ─── Orbit configs per level ──────────────────────────
// These unlock at the level's minStreak threshold
interface OrbitConfig {
    minStreak: number;
    radiusFactor: number;
    speed: number;
    reverse: boolean;
    dotCount: number;
    dotSize: number;
    color: string;
    dotColor: string;
}

const ORBIT_CONFIGS: OrbitConfig[] = [
    // Level 1 (day 0): inner orbit
    { minStreak: 0, radiusFactor: 0.55, speed: 1.5, reverse: false, dotCount: 1, dotSize: 5, color: 'rgba(255,255,255,0.06)', dotColor: Colors.lavender },
    // Level 2 (day 7): second orbit
    { minStreak: 7, radiusFactor: 0.70, speed: -0.8, reverse: true, dotCount: 2, dotSize: 4, color: 'rgba(199,125,184,0.10)', dotColor: Colors.rosePink },
    // Level 3 (day 14): third orbit
    { minStreak: 14, radiusFactor: 0.85, speed: 1.2, reverse: false, dotCount: 2, dotSize: 4, color: 'rgba(255,255,255,0.05)', dotColor: Colors.goldSparkle },
    // Level 4 (day 30): fourth orbit
    { minStreak: 30, radiusFactor: 0.95, speed: -0.5, reverse: true, dotCount: 3, dotSize: 3, color: 'rgba(108,61,184,0.08)', dotColor: Colors.violet },
    // Level 5 (day 60): fifth orbit
    { minStreak: 60, radiusFactor: 1.05, speed: 0.7, reverse: false, dotCount: 2, dotSize: 4, color: 'rgba(255,255,255,0.04)', dotColor: '#B8E0F7' },
    // Level 6 (day 100): outermost orbit
    { minStreak: 100, radiusFactor: 1.15, speed: -0.4, reverse: true, dotCount: 4, dotSize: 3, color: 'rgba(245,208,138,0.06)', dotColor: Colors.goldSparkle },
];

// ─── Ring configs ─────────────────────────────────────
interface RingConfig {
    minStreak: number;
    radiusFactor: number;
    thickness: number;
    color: string;
    opacity: number;
}

const RING_CONFIGS: RingConfig[] = [
    { minStreak: 14, radiusFactor: 0.78, thickness: 1.5, color: Colors.lavender, opacity: 0.10 },
    { minStreak: 60, radiusFactor: 1.0, thickness: 1.5, color: Colors.softPink, opacity: 0.08 },
    { minStreak: 100, radiusFactor: 1.2, thickness: 1, color: Colors.goldSparkle, opacity: 0.06 },
];

// ─── Animated Orbit ───────────────────────────────────
function AnimatedOrbit({ config, size }: { config: OrbitConfig; size: number }) {
    const rotation = useSharedValue(0);

    useEffect(() => {
        const dur = 20000 / Math.abs(config.speed);
        rotation.value = withRepeat(
            withTiming(config.reverse ? -360 : 360, { duration: dur, easing: Easing.linear }),
            -1,
            false,
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const r = size * config.radiusFactor;

    return (
        <Animated.View
            style={[
                styles.orbit,
                { width: r, height: r, borderRadius: r / 2, borderColor: config.color },
                animStyle,
            ]}
        >
            {Array.from({ length: config.dotCount }).map((_, i) => {
                const angle = (360 / config.dotCount) * i;
                const rad = (angle * Math.PI) / 180;
                const x = r / 2 + (r / 2 - config.dotSize / 2) * Math.cos(rad) - config.dotSize / 2;
                const y = r / 2 + (r / 2 - config.dotSize / 2) * Math.sin(rad) - config.dotSize / 2;
                return (
                    <View
                        key={i}
                        style={{
                            position: 'absolute',
                            width: config.dotSize,
                            height: config.dotSize,
                            borderRadius: config.dotSize / 2,
                            backgroundColor: config.dotColor,
                            left: x,
                            top: y,
                        }}
                    />
                );
            })}
        </Animated.View>
    );
}

// ─── Main Component ───────────────────────────────────
export default function GalaxySphere({ size = 200, streakCount = 0 }: Props) {
    const rotation = useSharedValue(0);
    const pulse = useSharedValue(0);

    const level = getLevelForStreak(streakCount);

    // Core grows gradually: 0.28 at day 0 → ~0.45 at day 100+
    const coreScale = Math.min(0.28 + streakCount * 0.0017, 0.48);

    // Glow grows
    const glowFactor = Math.min(1.2 + streakCount * 0.004, 1.7);
    const glowAlpha = Math.min(0.06 + streakCount * 0.002, 0.26);

    // Daily stars: 1 per day, max ~60 visible
    const starCount = Math.min(streakCount, 60);
    const stars = useMemo(() => {
        return Array.from({ length: starCount }).map((_, i) => {
            const seed = i + 1;
            const angle = seededRandom(seed) * Math.PI * 2;
            // Stars spread between 25% and 55% of radius from center
            const minR = size * 0.25;
            const maxR = size * (0.30 + Math.min(streakCount, 100) * 0.0025); // range grows with streak
            const dist = minR + seededRandom(seed + 100) * (maxR - minR);
            const starSize = 1.5 + seededRandom(seed + 200) * 2.5; // 1.5-4px
            const colorIdx = Math.floor(seededRandom(seed + 300) * STAR_COLORS.length);
            const opacity = 0.4 + seededRandom(seed + 400) * 0.6;
            return {
                x: size / 2 + Math.cos(angle) * dist - starSize / 2,
                y: size / 2 + Math.sin(angle) * dist - starSize / 2,
                size: starSize,
                color: STAR_COLORS[colorIdx],
                opacity,
            };
        });
    }, [starCount, size, streakCount]);

    // Active orbits & rings
    const activeOrbits = useMemo(
        () => ORBIT_CONFIGS.filter(o => streakCount >= o.minStreak),
        [streakCount],
    );
    const activeRings = useMemo(
        () => RING_CONFIGS.filter(r => streakCount >= r.minStreak),
        [streakCount],
    );

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, { duration: 25000, easing: Easing.linear }),
            -1,
            false,
        );
        pulse.value = withRepeat(
            withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
            -1,
            true,
        );
    }, []);

    const coreRotation = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const glowAnim = useAnimatedStyle(() => {
        const scale = interpolate(pulse.value, [0, 1], [0.92, 1.08]);
        const opacity = interpolate(pulse.value, [0, 1], [glowAlpha, glowAlpha + 0.15]);
        return { transform: [{ scale }], opacity };
    });

    const coreR = size * coreScale;
    const glowR = size * glowFactor;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Ambient glow */}
            <Animated.View
                style={[
                    styles.glow,
                    { width: glowR, height: glowR, borderRadius: glowR / 2 },
                    glowAnim,
                ]}
            />

            {/* Galaxy rings */}
            {activeRings.map((ring, i) => {
                const r = size * ring.radiusFactor;
                return (
                    <View
                        key={`ring-${i}`}
                        style={[
                            styles.galaxyRing,
                            {
                                width: r,
                                height: r,
                                borderRadius: r / 2,
                                borderWidth: ring.thickness,
                                borderColor: ring.color,
                                opacity: ring.opacity,
                            },
                        ]}
                    />
                );
            })}

            {/* Daily stars ✨ — each day adds one */}
            {stars.map((star, i) => (
                <View
                    key={`star-${i}`}
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

            {/* Orbits */}
            {activeOrbits.map((orbit, i) => (
                <AnimatedOrbit key={`orbit-${i}`} config={orbit} size={size} />
            ))}

            {/* Core sphere */}
            <Animated.View style={[styles.coreWrapper, { width: size, height: size }, coreRotation]}>
                <LinearGradient
                    colors={[
                        level.color + '90',  // tinted by current level
                        '#7B4DC7',
                        Colors.softPink,
                        '#2D1B4E',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.core, { width: coreR, height: coreR, borderRadius: coreR / 2 }]}
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
        backgroundColor: 'rgba(108, 61, 184, 0.15)',
    },
    coreWrapper: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    core: {
        ...Shadows.glow,
    },
    orbit: {
        position: 'absolute',
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    galaxyRing: {
        position: 'absolute',
    },
});
