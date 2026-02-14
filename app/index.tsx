import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
    const router = useRouter();
    const logoOpacity = useSharedValue(0);
    const logoScale = useSharedValue(0.8);
    const taglineOpacity = useSharedValue(0);
    const taglineTranslateY = useSharedValue(20);

    useEffect(() => {
        // Animate logo in
        logoOpacity.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.ease) });
        logoScale.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.back(1.5)) });

        // Animate tagline after logo
        taglineOpacity.value = withDelay(800, withTiming(1, { duration: 1000 }));
        taglineTranslateY.value = withDelay(800, withTiming(0, { duration: 1000, easing: Easing.out(Easing.ease) }));

        // Navigate after delay
        const timer = setTimeout(() => {
            router.replace('/onboarding');
        }, 3500);

        return () => clearTimeout(timer);
    }, []);

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
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: Spacing.xl,
        letterSpacing: 1,
    },
});
