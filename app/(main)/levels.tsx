import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import { COUPLE_LEVELS, getLevelForStreak } from '@/constants/levels';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { ms, vs } from '@/utils/scale';
import { useAppState } from '@/utils/store';
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
const NODE_SIZE = ms(56);
const PATH_WIDTH = width - Spacing.lg * 2;

/**
 * Generate a zigzag X position for each level node.
 * Alternates left → center → right → center → left,
 * creating a winding Candy Crush-style path.
 */
function getNodeX(index: number): number {
    const positions = [
        PATH_WIDTH * 0.2,     // left
        PATH_WIDTH * 0.5,     // center
        PATH_WIDTH * 0.8,     // right
        PATH_WIDTH * 0.5,     // center
    ];
    return positions[index % positions.length] - NODE_SIZE / 2;
}

export default function LevelsScreen() {
    const router = useRouter();
    const { state } = useAppState();
    const currentLevel = getLevelForStreak(state.streakCount);

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
                <Animated.View entering={FadeIn.duration(500)} style={styles.currentBadge}>
                    <Text style={styles.currentIcon}>{currentLevel.icon}</Text>
                    <View>
                        <Text style={styles.currentTitle}>{currentLevel.title}</Text>
                        <Text style={styles.currentSub}>
                            Day {state.streakCount} · {currentLevel.description}
                        </Text>
                    </View>
                </Animated.View>

                {/* Scrollable path — bottom-up */}
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.pathContainer}>
                        {levels.map((level, index) => {
                            const originalIndex = COUPLE_LEVELS.length - 1 - index;
                            const isUnlocked = state.streakCount >= level.minStreak;
                            const isCurrent = level.level === currentLevel.level;
                            const nodeX = getNodeX(index);

                            // Draw connector to next node
                            const showConnector = index < levels.length - 1;
                            const nextX = getNodeX(index + 1);

                            return (
                                <Animated.View
                                    key={level.level}
                                    entering={FadeInUp.delay(index * 120).duration(500)}
                                >
                                    {/* Connector line */}
                                    {showConnector && (
                                        <View
                                            style={[
                                                styles.connector,
                                                {
                                                    left: Math.min(nodeX, nextX) + NODE_SIZE / 2,
                                                    width: Math.abs(nextX - nodeX) + 2,
                                                    transform: [{
                                                        rotate: nextX > nodeX ? '30deg' : '-30deg',
                                                    }],
                                                },
                                                isUnlocked && styles.connectorUnlocked,
                                            ]}
                                        />
                                    )}

                                    {/* Node */}
                                    <View style={[styles.nodeRow, { marginLeft: nodeX }]}>
                                        <View
                                            style={[
                                                styles.node,
                                                { borderColor: level.color },
                                                isUnlocked && {
                                                    backgroundColor: level.color + '30',
                                                    ...Shadows.glow,
                                                    shadowColor: level.color,
                                                },
                                                isCurrent && styles.nodeCurrent,
                                                !isUnlocked && styles.nodeLocked,
                                            ]}
                                        >
                                            <Text style={[
                                                styles.nodeIcon,
                                                !isUnlocked && styles.nodeLocked,
                                            ]}>
                                                {isUnlocked ? level.icon : '🔒'}
                                            </Text>
                                        </View>

                                        {/* Label */}
                                        <View style={styles.nodeLabel}>
                                            <Text style={[
                                                styles.nodeName,
                                                isUnlocked && { color: level.color },
                                                !isUnlocked && styles.nodeNameLocked,
                                            ]}>
                                                {level.title}
                                            </Text>
                                            <Text style={styles.nodeStreak}>
                                                {level.minStreak === 0
                                                    ? 'Start'
                                                    : `Day ${level.minStreak}+`}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Spacer between nodes */}
                                    <View style={{ height: vs(50) }} />
                                </Animated.View>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: vs(56),
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
        fontSize: 15,
    },
    headerTitle: {
        ...Typography.bodySemiBold,
        fontSize: ms(18),
    },

    // ─── Current Badge ───────────────────────────────
    currentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginHorizontal: Spacing.lg,
        backgroundColor: Colors.white08,
        borderRadius: Radius.xl,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
    },
    currentIcon: {
        fontSize: ms(32),
    },
    currentTitle: {
        ...Typography.bodySemiBold,
        fontSize: ms(16),
        color: Colors.textPrimary,
    },
    currentSub: {
        ...Typography.caption,
        fontSize: ms(12),
        color: Colors.textMuted,
        marginTop: 1,
    },

    // ─── Path ────────────────────────────────────────
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: vs(80),
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
        top: NODE_SIZE / 2,
        zIndex: 0,
    },
    connectorUnlocked: {
        backgroundColor: Colors.white30,
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
        transform: [{ scale: 1.15 }],
    },
    nodeLocked: {
        opacity: 0.4,
    },
    nodeIcon: {
        fontSize: ms(24),
    },

    // ─── Label ───────────────────────────────────────
    nodeLabel: {
        gap: 1,
    },
    nodeName: {
        ...Typography.bodySemiBold,
        fontSize: ms(14),
        color: Colors.textPrimary,
    },
    nodeNameLocked: {
        color: Colors.textMuted,
    },
    nodeStreak: {
        ...Typography.caption,
        fontSize: ms(11),
        color: Colors.textMuted,
    },
});
