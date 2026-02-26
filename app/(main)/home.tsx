import AvatarMerge from '@/components/AvatarMerge';
import GalaxySphere from '@/components/GalaxySphere';
import GlowButton from '@/components/GlowButton';
import GradientBackground from '@/components/GradientBackground';
import SetupBanner from '@/components/SetupBanner';
import StarBackground from '@/components/StarBackground';
import StreakBadge from '@/components/StreakBadge';
import UrgencyHUD from '@/components/UrgencyHUD';
import { getLevelForStreak } from '@/constants/levels';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { QuestionService } from '@/utils/questionService';
import { useAppState } from '@/utils/store';
import { sendNudge } from '@/utils/supabase';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
    FadeInLeft,
    FadeInRight,
    FadeInUp,
    FadeOutLeft,
    FadeOutRight
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// ─── Menu Items ───────────────────────────────────────
const MENU_ITEMS = [
    { id: 'journal', icon: '📓', label: 'Journal', route: '/(main)/journal' },
    // Timeline removed as it is now linked to the streak badge
    // { id: 'levels', icon: '🗺️', label: 'Levels', route: '/(main)/levels' },
    { id: 'notifications', icon: '🔔', label: 'Notifications', route: '/(main)/notifications' },
    { id: 'settings', icon: '⚙️', label: 'Settings', route: '/(main)/settings' },
] as const;

// ─── UTC Countdown Helper ─────────────────────────────
function getUTCCountdown(): string {
    const now = new Date();
    const nextUTC = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0
    ));
    const diff = nextUTC.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function HomeScreen() {
    const router = useRouter();
    const posthog = usePostHog();
    const { state, update } = useAppState();
    const [menuOpen, setMenuOpen] = useState(false);
    const [ctaState, setCtaState] = useState<'answer' | 'waiting' | 'reveal' | 'done'>('answer');
    const [dailyId, setDailyId] = useState('');
    const [countdown, setCountdown] = useState(getUTCCountdown());
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const currentLevel = getLevelForStreak(state.streakCount);

    // Check today's question/answer status on mount.
    // Profile data is already fetched & guarded by (main)/_layout.tsx — no need to repeat it here.
    useEffect(() => {
        (async () => {
            try {
                const q = await QuestionService.getTodayQuestion();
                if (!q) {
                    setCtaState('answer');
                    return;
                }
                setDailyId(q.daily_id);
                const status = await QuestionService.getAnswerStatus(q.daily_id);
                if (status.hasAnswered && status.partnerAnswered) {
                    setCtaState('reveal');
                } else if (status.hasAnswered) {
                    setCtaState('waiting');
                } else {
                    setCtaState('answer');
                }
            } catch (err) {
                console.error('Home load error:', err);
                setCtaState('answer');
            }
        })();
    }, []);

    // ─── UTC Countdown Ticker ─────────────────────────
    useEffect(() => {
        timerRef.current = setInterval(() => setCountdown(getUTCCountdown()), 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const toggleMenu = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setMenuOpen(prev => !prev);
    }, []);

    const handleNudge = useCallback(async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
            await sendNudge();
            posthog.capture('nudge_sent', {
                streak_count: state.streakCount,
                partner_name: state.partnerName,
            });
            update({ lastNudgeAt: new Date().toISOString() });
        } catch (err) {
            console.warn('Nudge error:', err);
        }
    }, [update, posthog, state.streakCount, state.partnerName]);

    const handleMenuItemPress = useCallback((route: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(route as any);
        setMenuOpen(false);
    }, [router]);

    return (
        <GradientBackground>
            <StarBackground streakCount={state.streakCount} />
            <View style={styles.container}>
                {/* Top Section */}
                <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.topSection}>
                    <View style={styles.topRow}>
                        <AvatarMerge size={44} avatar1Uri={state.avatarUrl} avatar2Uri={state.partnerAvatarUrl} />
                        <View style={styles.topInfo}>
                            <Text style={styles.coupleNames} numberOfLines={1}>
                                {state.userFirstName || 'You'} & {state.partnerName || 'Love'}
                            </Text>
                            <Pressable onPress={() => router.push('/(main)/levels')}>
                                <Text style={styles.levelLabel}>
                                    {currentLevel.icon} {currentLevel.title}
                                </Text>
                            </Pressable>
                        </View>
                        {/* Badges - Linked to Timeline */}
                        <TouchableOpacity
                            onPress={() => router.push('/(main)/timeline')}
                        >
                            <StreakBadge count={state.streakCount} size="sm" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Center Galaxy */}
                <Animated.View entering={FadeIn.delay(500).duration(1200)} style={styles.galaxyContainer}>
                    <GalaxySphere size={width * 0.6} streakCount={state.streakCount} />
                    {/* <GalaxySphere size={width * 0.6} streakCount={state.streakCount} /> */}
                    {/* <Text style={styles.galaxyLabel}>Day {state.streakCount} of Your Universe</Text> */}
                </Animated.View>

                {/* Backdrop overlay when menu is open (Optional: prevents galaxy interaction) */}
                {menuOpen && (
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
                )}

                {/* Unified Footer Bar */}
                <SetupBanner />
                <UrgencyHUD
                    state={ctaState}
                    countdown={countdown}
                    partnerName={state.partnerName || 'Partner'}
                    onNudge={handleNudge}
                    lastNudgeAt={state.lastNudgeAt}
                    nudgeCooldownMinutes={state.nudgeCooldownMinutes}
                />
                <Animated.View entering={FadeInUp.delay(800).duration(800)} style={styles.floatingBar}>
                    <View style={[styles.unifiedFooter, menuOpen && styles.unifiedFooterActive]}>
                        {/* Menu Toggle Button */}
                        <TouchableOpacity
                            style={[styles.menuButton, menuOpen && styles.menuButtonActive]}
                            onPress={toggleMenu}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.menuButtonText}>{menuOpen ? '✕' : '☰'}</Text>
                        </TouchableOpacity>

                        {/* Dynamic Content Area: CTA Button OR Horizontal Menu */}
                        <View style={styles.dynamicFooterContent}>
                            {!menuOpen ? (
                                <Animated.View
                                    key="cta-button"
                                    entering={FadeInRight.duration(300)}
                                    exiting={FadeOutRight.duration(200)}
                                    style={styles.ctaContainer}
                                >
                                    <GlowButton
                                        title={
                                            ctaState === 'waiting' ? 'Waiting for Partner 💫' :
                                                ctaState === 'reveal' ? "See Today's Reveal ✨" :
                                                    "Today's Question ✨"
                                        }
                                        onPress={() => {
                                            if (ctaState === 'waiting') {
                                                router.push({ pathname: '/(main)/waiting', params: { daily_id: dailyId } } as any);
                                            } else if (ctaState === 'reveal') {
                                                router.push({ pathname: '/(main)/reveal', params: { daily_id: dailyId } } as any);
                                            } else {
                                                router.push('/(main)/question');
                                            }
                                        }}
                                        style={styles.ctaButton}
                                    />
                                </Animated.View>
                            ) : (
                                <Animated.View
                                    key="horizontal-menu"
                                    entering={FadeInLeft.duration(300)}
                                    exiting={FadeOutLeft.duration(200)}
                                    style={styles.horizontalMenu}
                                >
                                    {MENU_ITEMS.map((item) => (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={styles.horizontalMenuItem}
                                            onPress={() => handleMenuItemPress(item.route)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.menuIconCircle}>
                                                <Text style={styles.horizontalMenuIcon}>{item.icon}</Text>
                                            </View>
                                            <Text style={styles.horizontalMenuLabel}>{item.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </Animated.View>
                            )}
                        </View>
                    </View>
                </Animated.View>
            </View>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Spacing.xs,
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
        fontSize: Typography.lg.fontSize,
    },
    levelLabel: {
        ...Typography.caption,
        fontSize: Typography.sm.fontSize,
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
        fontSize: Typography.md.fontSize,
        color: Colors.textSecondary,
        marginTop: Spacing.xxl,
        letterSpacing: 1,
    },

    // ─── Floating Bottom Bar ─────────────────────────
    floatingBar: {
        paddingBottom: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        zIndex: 20,
    },
    unifiedFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(18, 10, 40, 0.85)',
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        padding: Spacing.sm,
        gap: Spacing.sm,
        ...Shadows.soft,
    },
    unifiedFooterActive: {
        backgroundColor: 'rgba(28, 14, 56, 0.95)',
        borderColor: Colors.softPink,
    },
    menuButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    menuButtonActive: {
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderColor: Colors.softPink,
    },
    menuButtonText: {
        fontSize: Typography.lg.fontSize,
        color: Colors.textPrimary,
    },

    // ─── Dynamic Footer Content ──────────────────────
    dynamicFooterContent: {
        flex: 1,
        // height: 44, // Match button height
        justifyContent: 'center',
    },
    ctaContainer: {
        flex: 1,
        height: '100%',
    },
    ctaButton: {
        flex: 1,
        borderRadius: Radius.full,
    },

    // ─── Horizontal Menu ─────────────────────────────
    horizontalMenu: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        flex: 1,
        paddingRight: Spacing.sm,
    },
    horizontalMenuItem: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 44,
    },
    menuIconCircle: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    horizontalMenuIcon: {
        fontSize: Typography.lg.fontSize, // Slightly larger
        marginBottom: 2,
    },
    horizontalMenuLabel: {
        ...Typography.caption,
        fontSize: Typography.xs.fontSize,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
});
