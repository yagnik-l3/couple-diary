import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { getProfile, getSession } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const MIN_SPLASH_DURATION = 2200; // Minimum ms the splash is visible before navigating

export default function SplashScreen() {
    const router = useRouter();
    const logoOpacity = useSharedValue(0);
    const logoScale = useSharedValue(0.8);
    const taglineOpacity = useSharedValue(0);
    const taglineTranslateY = useSharedValue(20);

    const [showRetry, setShowRetry] = useState(false);
    const [retrying, setRetrying] = useState(false);

    // ── Resolves the correct destination route without navigating yet.
    // Retries once on transient network failures before giving up.
    const resolveRoute = useCallback(async (): Promise<string> => {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const session = await getSession();

                if (!session) {
                    // No session at all → full onboarding flow.
                    return '/onboarding';
                }

                // Session exists — fetch profile to check how far setup got.
                const profile = await getProfile();

                if (!profile) {
                    // Authenticated but profile row missing → start at name step.
                    return '/onboarding?resume=name';
                }

                if (!profile.couple_id) {
                    // Profile exists but not yet paired → jump to invite step.
                    return '/onboarding?resume=invite';
                }

                // Fully set up → home screen!
                return '/(main)/home';
            } catch (err) {
                if (attempt === 0) {
                    // Wait briefly then retry once for transient network hiccups.
                    await new Promise(r => setTimeout(r, 600));
                    continue;
                }
                // Second attempt also failed.
                // If we still have a locally-cached session trust it and go home;
                // the main layout re-fetches the profile once the network recovers.
                console.warn('[Splash] Auth check failed after retry:', err);
                try {
                    const session = await getSession();
                    if (session) return '/(main)/home';
                } catch { /* ignore */ }
            }
        }
        // Truly unrecoverable — restart from fresh onboarding.
        return '/onboarding';
    }, []);

    // ── Runs auth + waits for minimum splash duration before navigating.
    const runAuthFlow = useCallback(async () => {
        setRetrying(true);
        setShowRetry(false);
        try {
            const minDisplay = new Promise<void>(r => setTimeout(r, MIN_SPLASH_DURATION));

            // Auth check starts IMMEDIATELY in parallel with the animation.
            // Navigation only fires once BOTH the route is resolved AND the
            // minimum display time has elapsed — eliminating the race condition.
            const [, route] = await Promise.all([minDisplay, resolveRoute()]);
            router.replace(route as any);
        } catch (err) {
            // resolveRoute() handles its own errors internally; this only fires
            // on truly unexpected failures (e.g., router itself threw).
            console.error('[Splash] Unhandled error in auth flow:', err);
            setShowRetry(true);
        } finally {
            setRetrying(false);
        }
    }, [resolveRoute, router]);

    useEffect(() => {
        // Start animations.
        logoOpacity.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.ease) });
        logoScale.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.back(1.5)) });
        taglineOpacity.value = withDelay(800, withTiming(1, { duration: 1000 }));
        taglineTranslateY.value = withDelay(800, withTiming(0, { duration: 1000, easing: Easing.out(Easing.ease) }));

        // Start auth check at the same time (not after a fixed delay).
        runAuthFlow();
    }, [logoOpacity, logoScale, taglineOpacity, taglineTranslateY, runAuthFlow]);

    const logoStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ scale: logoScale.value }],
    }));

    const taglineStyle = useAnimatedStyle(() => ({
        opacity: taglineOpacity.value,
        transform: [{ translateY: taglineTranslateY.value }],
    }));

    return (
        <GradientBackground>
            <StarBackground />
            <View style={styles.container}>
                {/* Logo Glow */}
                <View style={styles.glowCircle} />

                <Animated.View style={[styles.logoContainer, logoStyle]}>
                    <Text style={styles.logoIcon}>✨</Text>
                    <Text style={styles.logoText}>Couple</Text>
                    <Text style={styles.logoTextAccent}>Diary</Text>
                </Animated.View>

                <Animated.Text style={[styles.tagline, taglineStyle]}>
                    Grow Your Universe Together
                </Animated.Text>

                {showRetry && (
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={runAuthFlow}
                        disabled={retrying}
                    >
                        {retrying ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.retryButtonText}>Retry</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowCircle: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(108, 61, 184, 0.2)',
    },
    logoContainer: {
        alignItems: 'center',
        gap: 4,
    },
    logoIcon: {
        fontSize: 48,
        marginBottom: Spacing.md,
    },
    logoText: {
        ...Typography.heading,
        fontSize: 42,
        letterSpacing: 2,
    },
    logoTextAccent: {
        ...Typography.headingItalic,
        fontSize: 36,
        color: Colors.softPink,
        marginTop: -8,
    },
    tagline: {
        ...Typography.body,
        color: Colors.textSecondary,
        marginTop: Spacing.xxl,
        letterSpacing: 1,
    },
    retryButton: {
        marginTop: Spacing.xl,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        backgroundColor: Colors.violet,
        borderRadius: Spacing.md,
    },
    retryButtonText: {
        ...Typography.body,
        color: '#fff',
        fontWeight: 'bold',
    },
});
