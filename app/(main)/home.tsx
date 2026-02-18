import AvatarMerge from '@/components/AvatarMerge';
import GalaxySphere from '@/components/GalaxySphere';
import GlowButton from '@/components/GlowButton';
import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import StreakBadge from '@/components/StreakBadge';
import { getLevelForStreak } from '@/constants/levels';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { QuestionService } from '@/utils/questionService';
import { s } from '@/utils/scale';
import { useAppState } from '@/utils/store';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
    { id: 'levels', icon: '🗺️', label: 'Levels', route: '/(main)/levels' },
    { id: 'notifications', icon: '🔔', label: 'Notifications', route: '/(main)/notifications' },
    { id: 'settings', icon: '⚙️', label: 'Settings', route: '/(main)/settings' },
] as const;

export default function HomeScreen() {
    const router = useRouter();
    const { state, update } = useAppState();
    const [menuOpen, setMenuOpen] = useState(false);
    const [ctaState, setCtaState] = useState<'answer' | 'waiting' | 'reveal' | 'done'>('answer');
    const [dailyId, setDailyId] = useState('');

    const currentLevel = getLevelForStreak(state.streakCount);
    // const progress = getStreakProgress(state.streakCount); // Unused

    // Check today's answer status on mount
    useEffect(() => {
        (async () => {
            try {
                // Refresh profile/couple data to get latest streak and partner info
                const profile = await (await import('@/utils/supabase')).getProfile();
                if (profile) {
                    if (!profile.couple_id) {
                        router.replace('/onboarding');
                        return;
                    }
                    update({
                        streakCount: profile.streak_count,
                        bestStreak: profile.best_streak,
                        partnerName: profile.partner_name,
                        userFirstName: profile.first_name || profile.name,
                        userLastName: profile.last_name || '',
                        userEmail: profile.email || '',
                        userGender: profile.gender || '',
                        userBirthDate: profile.birth_date || '',
                        relationshipDate: profile.relationship_date || '',
                        topicPreferences: profile.topic_preferences || [],
                        lives: profile.lives || 1,
                        hasPartner: true,
                        questionsAnswered: profile.questions_answered || 0,
                        avatarUrl: profile.avatar_url || '',
                        partnerAvatarUrl: profile.partner_avatar_url || '',
                        reminderTime: profile.reminder_time || '',
                        coupleVibe: profile.couple_vibe || '',
                        coupleEditorId: profile.editor_user_id || '',
                    });
                }

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

    const toggleMenu = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setMenuOpen(prev => !prev);
    };

    const handleMenuItemPress = (route: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Small delay to allow ripple/animation if needed, but immediate feels snappier
        router.push(route as any);
        setMenuOpen(false);
    };

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
                                {state.userFirstName || 'You'} & {state.partnerName || 'Love'}
                            </Text>
                            <Text style={styles.levelLabel}>
                                {currentLevel.icon} {currentLevel.title}
                            </Text>
                        </View>
                        {/* Streak Badge - Linked to Timeline */}
                        <TouchableOpacity onPress={() => router.push('/(main)/timeline')}>
                            <StreakBadge count={state.streakCount} size="sm" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Center Galaxy */}
                <Animated.View entering={FadeIn.delay(500).duration(1200)} style={styles.galaxyContainer}>
                    {/* <GalaxySphere size={width * 0.6} streakCount={390} /> */}
                    <GalaxySphere size={width * 0.6} streakCount={state.streakCount} />
                    <Text style={styles.galaxyLabel}>Day {state.streakCount} of Your Universe</Text>
                </Animated.View>

                {/* Backdrop overlay when menu is open (Optional: prevents galaxy interaction) */}
                {menuOpen && (
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
                )}

                {/* Unified Footer Bar */}
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
                                                ctaState === 'reveal' ? 'See Today\'s Reveal ✨' :
                                                    'Today\'s Question ✨'
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
        paddingBottom: 36,
        zIndex: 20,
    },
    unifiedFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.cardBg,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        padding: 7, // More room
        gap: 8,
        ...Shadows.soft,
        minHeight: 74, // Final height boost
    },
    unifiedFooterActive: {
        backgroundColor: Colors.cardBgSolid,
        borderColor: Colors.softPink,
    },
    menuButton: {
        width: 60, // Scaled up
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuButtonActive: {
        backgroundColor: Colors.white08,
    },
    menuButtonText: {
        fontSize: s(22),
        color: Colors.textPrimary,
    },

    // ─── Dynamic Footer Content ──────────────────────
    dynamicFooterContent: {
        flex: 1,
        height: 60, // Match button height
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
        minWidth: 50,
    },
    menuIconCircle: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    horizontalMenuIcon: {
        fontSize: s(20), // Slightly larger
        marginBottom: 2,
    },
    horizontalMenuLabel: {
        ...Typography.caption,
        fontSize: 10,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
});
