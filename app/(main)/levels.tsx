import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import { COUPLE_LEVELS, getLevelForStreak, getNextLevel } from '@/constants/levels';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { s } from '@/utils/scale';
import { useAppState } from '@/utils/store';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const NODE_SIZE = s(56);
const PATH_WIDTH = s(600); // Fixed large width for consistent journey feel

/**
 * Generate a zigzag X position for each level node.
 * Alternates left → center → right → center → left,
 * creating a winding Candy Crush-style path.
 */
function getNodeX(index: number): number {
    const minPadding = Spacing.lg;
    const maxContentWidth = PATH_WIDTH - s(180); // Reserve space for label + padding

    const positions = [
        minPadding,
        (maxContentWidth * 0.4),
        (maxContentWidth * 0.8),
        (maxContentWidth * 0.4),
    ];
    return positions[index % positions.length];
}

export default function LevelsScreen() {
    const router = useRouter();
    const { state } = useAppState();
    const currentLevel = getLevelForStreak(state.streakCount);
    const nextLevel = getNextLevel(state.streakCount);

    // Reversed so the current/lowest level is at the bottom
    const levels = [...COUPLE_LEVELS].reverse();

    return (
        <GradientBackground>
            <StarBackground />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>🗺️ Level Path</Text>
                    <View style={{ width: 50 }} />
                </View>

                {/* Current level badge */}
                <Animated.View entering={FadeIn.duration(500)} style={styles.currentBadgeContainer}>
                    <LinearGradient
                        colors={[Colors.white12, Colors.white05]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.currentBadgeGradient}
                    >
                        <Text style={styles.currentIcon}>{currentLevel.icon}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.currentTitle}>{currentLevel.title}</Text>
                            <Text style={styles.currentSub}>
                                Day {state.streakCount} · {currentLevel.description}
                            </Text>
                            {nextLevel && (
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBar}>
                                        <View
                                            style={[
                                                styles.progressFill,
                                                { width: `${Math.min(100, (state.streakCount / nextLevel.minStreak) * 100)}%` }
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.progressText}>
                                        {nextLevel.minStreak - state.streakCount} days until {nextLevel.title}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Scrollable path — bottom-up */}
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalScrollContent}
                        bounces={true}
                        nestedScrollEnabled={true}
                    >
                        <View style={[styles.pathContainer, { width: PATH_WIDTH }]}>
                            {levels.map((level, index) => {
                                const isUnlocked = state.streakCount >= level.minStreak;
                                const isCurrent = level.level === currentLevel.level;
                                const nodeX = getNodeX(index);

                                // Connector to NEXT node (the one below)
                                const showConnector = index < levels.length - 1;
                                const nextX = getNodeX(index + 1);

                                const vDist = s(50) + NODE_SIZE;
                                const dx = nextX - nodeX;
                                const distance = Math.sqrt(dx * dx + vDist * vDist);
                                const angle = Math.atan2(vDist, dx);

                                return (
                                    <Animated.View
                                        key={level.level}
                                        entering={FadeInUp.delay(index * 120).duration(500)}
                                        style={{ zIndex: levels.length - index }}
                                    >
                                        {/* Connector line - Handled with midpoint rotation since transformOrigin is finicky across RN platforms */}
                                        {showConnector && (
                                            <View
                                                style={[
                                                    styles.connector,
                                                    {
                                                        width: distance,
                                                        left: (nodeX + nextX + NODE_SIZE) / 2 - distance / 2,
                                                        top: NODE_SIZE + s(50) / 2,
                                                        transform: [{ rotate: `${angle}rad` }],
                                                    },
                                                    isUnlocked && (state.streakCount >= (levels[index + 1]?.minStreak || 0)) && styles.connectorUnlocked,
                                                ]}
                                            />
                                        )}

                                        {/* Node Row */}
                                        <View style={[styles.nodeRow, { marginLeft: nodeX }]}>
                                            <View
                                                style={[
                                                    styles.node,
                                                    { borderColor: level.color },
                                                    isUnlocked && {
                                                        backgroundColor: level.color + '20',
                                                        ...Shadows.glow,
                                                        shadowColor: level.color,
                                                    },
                                                    isCurrent && styles.nodeCurrent,
                                                    !isUnlocked && styles.nodeLocked,
                                                ]}
                                            >
                                                <Text style={styles.nodeIcon}>
                                                    {isUnlocked ? level.icon : '🔒'}
                                                </Text>
                                                {isCurrent && <View style={[styles.pulse, { backgroundColor: level.color }]} />}
                                            </View>

                                            <View style={styles.nodeLabel}>
                                                <Text style={[
                                                    styles.nodeName,
                                                    isUnlocked && { color: level.color },
                                                    !isUnlocked && styles.nodeNameLocked,
                                                ]}>
                                                    {level.title}
                                                </Text>
                                                <Text style={styles.nodeStreak}>
                                                    {level.minStreak === 0 ? 'Start' : `Day ${level.minStreak}+`}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={{ height: s(50) }} />
                                    </Animated.View>
                                );
                            })}
                        </View>
                    </ScrollView>
                </ScrollView>
            </View>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Spacing.xs,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    backText: {
        ...Typography.body,
        color: Colors.textSecondary,
    },
    headerTitle: {
        ...Typography.bodySemiBold,
        fontSize: s(18),
    },

    // ─── Current Badge ───────────────────────────────
    currentBadgeContainer: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        borderRadius: Radius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        ...Shadows.soft,
    },
    currentBadgeGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
    },
    currentIcon: {
        fontSize: s(32),
    },
    currentTitle: {
        ...Typography.bodySemiBold,
        fontSize: s(16),
        color: Colors.textPrimary,
    },
    currentSub: {
        ...Typography.caption,
        fontSize: s(12),
        color: Colors.textMuted,
        marginTop: 1,
    },

    // ─── Path ────────────────────────────────────────
    scrollContent: {
        paddingTop: Spacing.md,
        paddingBottom: s(80),
    },
    horizontalScrollContent: {
        paddingHorizontal: Spacing.lg,
    },
    pathContainer: {
        position: 'relative',
    },

    // ─── Connector ───────────────────────────────────
    connector: {
        position: 'absolute',
        height: 3,
        backgroundColor: Colors.white08,
        borderRadius: 2,
        zIndex: 0,
    },
    connectorUnlocked: {
        backgroundColor: Colors.softPink + '60',
    },

    // ─── Progress ────────────────────────────────────
    progressContainer: {
        marginTop: Spacing.sm,
        gap: 4,
    },
    progressBar: {
        height: 6,
        backgroundColor: Colors.white08,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.softPink,
    },
    progressText: {
        ...Typography.caption,
        fontSize: s(10),
        color: Colors.textSecondary,
    },

    // ─── Node ────────────────────────────────────────
    nodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        zIndex: 1,
    },
    node: {
        width: NODE_SIZE,
        height: NODE_SIZE,
        borderRadius: NODE_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2.5,
        backgroundColor: Colors.cardBg,
    },
    nodeCurrent: {
        transform: [{ scale: 1.2 }],
        borderWidth: 3,
    },
    nodeLocked: {
        opacity: 0.5,
        borderStyle: 'dashed',
    },
    nodeIcon: {
        fontSize: s(24),
    },
    pulse: {
        position: 'absolute',
        width: NODE_SIZE + 10,
        height: NODE_SIZE + 10,
        borderRadius: (NODE_SIZE + 10) / 2,
        opacity: 0.2,
        zIndex: -1,
    },

    // ─── Label ───────────────────────────────────────
    nodeLabel: {
        gap: 1,
    },
    nodeName: {
        ...Typography.bodySemiBold,
        fontSize: s(14),
        color: Colors.textPrimary,
    },
    nodeNameLocked: {
        color: Colors.textMuted,
    },
    nodeStreak: {
        ...Typography.caption,
        fontSize: s(11),
        color: Colors.textMuted,
    },
});
