import AvatarMerge from '@/components/AvatarMerge';
import GalaxySphere from '@/components/GalaxySphere';
import GlowButton from '@/components/GlowButton';
import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import StreakBadge from '@/components/StreakBadge';
import { getLevelForStreak, getStreakProgress } from '@/constants/levels';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { ms } from '@/utils/scale';
import { useAppState } from '@/utils/store';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInUp,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// ─── Menu Items ───────────────────────────────────────
const MENU_ITEMS = [
    { id: 'journal', icon: '📓', label: 'Journal', route: '/(main)/journal' },
    { id: 'timeline', icon: '📜', label: 'Timeline', route: '/(main)/timeline' },
    { id: 'levels', icon: '🗺️', label: 'Levels', route: '/(main)/levels' },
    { id: 'notifications', icon: '🔔', label: 'Notifications', route: '/(main)/notifications' },
    { id: 'profile', icon: '👤', label: 'Profile', route: '/(main)/profile' },
    { id: 'settings', icon: '⚙️', label: 'Settings', route: '/(main)/settings' },
] as const;

export default function HomeScreen() {
    const router = useRouter();
    const { state } = useAppState();
    const [menuOpen, setMenuOpen] = useState(false);

    const currentLevel = getLevelForStreak(state.streakCount);
    const progress = getStreakProgress(state.streakCount);

    // Animated menu scale
    const menuScale = useSharedValue(0);
    const menuOpacity = useSharedValue(0);

    const toggleMenu = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (menuOpen) {
            menuScale.value = withSpring(0, { damping: 15, stiffness: 200 });
            menuOpacity.value = withSpring(0, { damping: 15, stiffness: 200 });
            setMenuOpen(false);
        } else {
            setMenuOpen(true);
            menuScale.value = withSpring(1, { damping: 14, stiffness: 160, mass: 0.8 });
            menuOpacity.value = withSpring(1, { damping: 14, stiffness: 160 });
        }
    };

    const closeMenu = () => {
        if (!menuOpen) return;
        menuScale.value = withSpring(0, { damping: 15, stiffness: 200 });
        menuOpacity.value = withSpring(0, { damping: 15, stiffness: 200 });
        setMenuOpen(false);
    };

    const handleMenuItemPress = (route: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        closeMenu();
        setTimeout(() => {
            router.push(route as any);
        }, 150);
    };

    const menuAnimStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: menuScale.value },
            { translateY: (1 - menuScale.value) * 20 },
        ],
        opacity: menuOpacity.value,
    }));

    return (
        <GradientBackground>
            <StarBackground streakCount={390} />
            <View style={styles.container}>
                {/* Top Section */}
                <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.topSection}>
                    <View style={styles.topRow}>
                        <AvatarMerge size={44} />
                        <View style={styles.topInfo}>
                            <Text style={styles.coupleNames} numberOfLines={1}>
                                {state.userName || 'You'} & {state.partnerName || 'Love'}
                            </Text>
                            <Text style={styles.levelLabel}>
                                {currentLevel.icon} {currentLevel.title}
                            </Text>
                        </View>
                        <StreakBadge count={state.streakCount} size="sm" />
                    </View>
                </Animated.View>

                {/* Center Galaxy */}
                <Animated.View entering={FadeIn.delay(500).duration(1200)} style={styles.galaxyContainer}>
                    <GalaxySphere size={width * 0.6} streakCount={390} />
                    {/* <GalaxySphere size={width * 0.6} streakCount={state.streakCount} /> */}
                    <Text style={styles.galaxyLabel}>Day {state.streakCount} of Your Universe</Text>
                </Animated.View>

                {/* Backdrop overlay when menu is open */}
                {menuOpen && (
                    <Animated.View
                        entering={FadeIn.duration(200)}
                        exiting={FadeOut.duration(200)}
                        style={StyleSheet.absoluteFill}
                    >
                        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
                    </Animated.View>
                )}

                {/* Menu popup card — anchored above the floating buttons */}
                <Animated.View style={[styles.menuPopup, menuAnimStyle]} pointerEvents={menuOpen ? 'auto' : 'none'}>
                    {MENU_ITEMS.map((item, i) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.menuItem,
                                i < MENU_ITEMS.length - 1 && styles.menuItemBorder,
                            ]}
                            onPress={() => handleMenuItemPress(item.route)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.menuItemIcon}>{item.icon}</Text>
                            <Text style={styles.menuItemLabel}>{item.label}</Text>
                            <Text style={styles.menuItemArrow}>›</Text>
                        </TouchableOpacity>
                    ))}
                </Animated.View>

                {/* Floating bottom buttons */}
                <Animated.View entering={FadeInUp.delay(800).duration(800)} style={styles.floatingBar}>
                    <TouchableOpacity
                        style={[styles.menuButton, menuOpen && styles.menuButtonActive]}
                        onPress={toggleMenu}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.menuButtonText}>{menuOpen ? '✕' : '☰'}</Text>
                    </TouchableOpacity>

                    <GlowButton
                        title="Today's Question ✨"
                        onPress={() => router.push('/(main)/question')}
                        style={styles.ctaButton}
                    />
                </Animated.View>
            </View>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 56,
        paddingHorizontal: Spacing.lg,
    },
    topSection: {
        zIndex: 10,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    topInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    coupleNames: {
        ...Typography.bodySemiBold,
        fontSize: 16,
    },
    levelLabel: {
        ...Typography.caption,
        fontSize: 12,
        color: Colors.goldSparkle,
        marginTop: 1,
    },

    galaxyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    galaxyLabel: {
        ...Typography.body,
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: Spacing.xxl,
        letterSpacing: 1,
    },

    // ─── Floating Bottom Bar ─────────────────────────
    floatingBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingBottom: 36,
        zIndex: 20,
    },
    menuButton: {
        width: 48,
        height: 48,
        borderRadius: Radius.xl,
        backgroundColor: Colors.cardBg,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.soft,
    },
    menuButtonActive: {
        backgroundColor: Colors.white15,
        borderColor: Colors.softPink,
    },
    menuButtonText: {
        fontSize: ms(20),
        color: Colors.textPrimary,
    },
    ctaButton: {
        flex: 1,
    },

    // ─── Menu Popup ──────────────────────────────────
    menuPopup: {
        position: 'absolute',
        bottom: 100,
        left: Spacing.lg,
        width: 210,
        backgroundColor: Colors.cardBgSolid,
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        paddingVertical: Spacing.xs,
        zIndex: 30,
        ...Shadows.glow,
        transformOrigin: 'bottom left',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md - 2,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.md,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.white08,
    },
    menuItemIcon: {
        fontSize: ms(18),
    },
    menuItemLabel: {
        ...Typography.bodyMedium,
        fontSize: ms(14),
        color: Colors.textPrimary,
        flex: 1,
    },
    menuItemArrow: {
        fontSize: ms(18),
        color: Colors.textMuted,
    },
});
