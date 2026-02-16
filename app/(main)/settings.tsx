import FloatingCard from '@/components/FloatingCard';
import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import ToggleSwitch from '@/components/ToggleSwitch';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAppState } from '@/utils/store';
import { getInviteCode } from '@/utils/supabase';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface SettingRowProps {
    icon: string;
    label: string;
    value?: boolean;
    onToggle?: (val: boolean) => void;
    onPress?: () => void;
    showArrow?: boolean;
    danger?: boolean;
}

function SettingRow({ icon, label, value, onToggle, onPress, showArrow, danger }: SettingRowProps) {
    const content = (
        <View style={styles.settingRow}>
            <Text style={styles.settingIcon}>{icon}</Text>
            <Text style={[styles.settingLabel, danger && styles.dangerText]}>{label}</Text>
            {value !== undefined && onToggle ? (
                <ToggleSwitch value={value} onToggle={onToggle} />
            ) : showArrow ? (
                <Text style={styles.arrow}>›</Text>
            ) : null}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {content}
            </TouchableOpacity>
        );
    }
    return content;
}

export default function SettingsScreen() {
    const router = useRouter();
    const { state, reset } = useAppState();
    const [notifications, setNotifications] = useState(true);
    const [dailyReminder, setDailyReminder] = useState(true);
    const [soundEffects, setSoundEffects] = useState(true);
    const [haptics, setHaptics] = useState(true);

    // Invite code modal
    const [inviteModalVisible, setInviteModalVisible] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [loadingCode, setLoadingCode] = useState(false);
    const [copied, setCopied] = useState(false);

    const isPaired = state.hasPartner;

    const openInviteModal = useCallback(async () => {
        setInviteModalVisible(true);
        setLoadingCode(true);
        setCopied(false);
        try {
            const code = await getInviteCode();
            setInviteCode(code || 'N/A');
        } catch {
            setInviteCode('Error loading');
        } finally {
            setLoadingCode(false);
        }
    }, []);

    const handleCopy = async () => {
        if (!inviteCode) return;
        await Clipboard.setStringAsync(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    const handleShare = async () => {
        if (!inviteCode) return;
        try {
            await Share.share({
                message: `Join me on Couple Diary! 💕\n\nUse my invite code: ${inviteCode}\n\nDownload the app and enter this code to connect with me ✨`,
            });
        } catch {
            // user cancelled
        }
    };

    return (
        <GradientBackground>
            <StarBackground />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Account */}
                <Animated.View entering={FadeInUp.delay(100).duration(500)}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <FloatingCard style={styles.sectionCard}>
                        <SettingRow icon="👤" label="Profile" onPress={() => router.push('/(main)/profile')} showArrow />
                        <View style={styles.rowDivider} />
                        <SettingRow icon="💌" label="Invite Partner" onPress={openInviteModal} showArrow />
                    </FloatingCard>
                </Animated.View>

                {/* Notifications */}
                <Animated.View entering={FadeInUp.delay(200).duration(500)}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <FloatingCard style={styles.sectionCard}>
                        <SettingRow
                            icon="🔔"
                            label="Push Notifications"
                            value={notifications}
                            onToggle={setNotifications}
                        />
                        <View style={styles.rowDivider} />
                        <SettingRow
                            icon="⏰"
                            label="Daily Reminder"
                            value={dailyReminder}
                            onToggle={setDailyReminder}
                        />
                        <View style={styles.rowDivider} />
                        <SettingRow
                            icon="🔊"
                            label="Sound Effects"
                            value={soundEffects}
                            onToggle={setSoundEffects}
                        />
                        <View style={styles.rowDivider} />
                        <SettingRow
                            icon="📳"
                            label="Haptic Feedback"
                            value={haptics}
                            onToggle={setHaptics}
                        />
                    </FloatingCard>
                </Animated.View>

                {/* Preferences */}
                <Animated.View entering={FadeInUp.delay(300).duration(500)}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <FloatingCard style={styles.sectionCard}>
                        <SettingRow icon="🎨" label="Theme Selection" onPress={() => { }} showArrow />
                        <View style={styles.rowDivider} />
                        <SettingRow icon="🔐" label="Privacy" onPress={() => { }} showArrow />
                    </FloatingCard>
                </Animated.View>

                {/* Data */}
                <Animated.View entering={FadeInUp.delay(400).duration(500)}>
                    <Text style={styles.sectionTitle}>Data</Text>
                    <FloatingCard style={styles.sectionCard}>
                        <SettingRow icon="📦" label="Export Memories" onPress={() => { }} showArrow />
                    </FloatingCard>
                </Animated.View>

                {/* Danger Zone */}
                <Animated.View entering={FadeInUp.delay(500).duration(500)}>
                    <FloatingCard style={{ ...styles.sectionCard, ...styles.dangerCard }}>
                        <SettingRow
                            icon="🚪"
                            label="Log Out"
                            onPress={() => {
                                Alert.alert('Log Out', 'Are you sure you want to log out?', [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Log Out',
                                        style: 'destructive',
                                        onPress: () => {
                                            reset();
                                            router.replace('/onboarding');
                                        },
                                    },
                                ]);
                            }}
                            danger
                            showArrow
                        />
                    </FloatingCard>
                </Animated.View>

                {/* Version */}
                <Text style={styles.versionText}>Couple Diary v1.0.0 ✨</Text>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* ─── Invite Code Modal ──────────────────────────── */}
            <Modal
                visible={inviteModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setInviteModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setInviteModalVisible(false)}
                >
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalEmoji}>💌</Text>
                            <Text style={styles.modalTitle}>Invite Partner</Text>
                            <TouchableOpacity
                                onPress={() => setInviteModalVisible(false)}
                                style={styles.modalClose}
                            >
                                <Text style={styles.modalCloseText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Status */}
                        {isPaired ? (
                            <View style={styles.pairedBanner}>
                                <Text style={styles.pairedIcon}>✅</Text>
                                <Text style={styles.pairedText}>Partner connected!</Text>
                            </View>
                        ) : (
                            <Text style={styles.modalSubtitle}>
                                Share this code with your partner to connect your accounts
                            </Text>
                        )}

                        {/* Code */}
                        {loadingCode ? (
                            <View style={styles.codeLoading}>
                                <ActivityIndicator size="small" color={Colors.softPink} />
                            </View>
                        ) : (
                            <View style={styles.codeContainer}>
                                <Text style={styles.codeLabel}>Your Invite Code</Text>
                                <Text style={styles.codeText}>{inviteCode}</Text>
                            </View>
                        )}

                        {/* Actions */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.copyButton]}
                                onPress={handleCopy}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.actionIcon}>{copied ? '✓' : '📋'}</Text>
                                <Text style={[styles.actionText, copied && styles.copiedText]}>
                                    {copied ? 'Copied!' : 'Copy Code'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.shareButton]}
                                onPress={handleShare}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.actionIcon}>📤</Text>
                                <Text style={styles.actionText}>Share</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    backText: {
        ...Typography.body,
        color: Colors.textSecondary,
        fontSize: 15,
    },
    headerTitle: {
        ...Typography.bodySemiBold,
        fontSize: 18,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
    },
    sectionTitle: {
        ...Typography.bodySemiBold,
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        marginTop: Spacing.md,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionCard: {
        padding: 0,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        gap: Spacing.md,
    },
    settingIcon: {
        fontSize: 20,
        width: 28,
        textAlign: 'center',
    },
    settingLabel: {
        ...Typography.bodyMedium,
        fontSize: 15,
        flex: 1,
    },
    arrow: {
        ...Typography.body,
        fontSize: 22,
        color: Colors.textMuted,
    },
    rowDivider: {
        height: 1,
        backgroundColor: Colors.white08,
        marginLeft: 56,
    },
    dangerCard: {
        marginTop: Spacing.md,
        borderColor: 'rgba(232, 106, 106, 0.2)',
    },
    dangerText: {
        color: Colors.danger,
    },
    versionText: {
        ...Typography.caption,
        fontSize: 12,
        textAlign: 'center',
        marginTop: Spacing.xl,
        color: Colors.textMuted,
    },
    bottomSpacer: {
        height: 60,
    },

    // ─── Modal ────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modalContent: {
        width: '100%',
        backgroundColor: Colors.cardBgSolid,
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        padding: Spacing.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    modalEmoji: {
        fontSize: 28,
        marginRight: Spacing.sm,
    },
    modalTitle: {
        ...Typography.heading,
        fontSize: 22,
        flex: 1,
    },
    modalClose: {
        padding: 4,
    },
    modalCloseText: {
        fontSize: 20,
        color: Colors.textMuted,
    },
    modalSubtitle: {
        ...Typography.body,
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
        lineHeight: 20,
    },
    pairedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(52, 199, 89, 0.12)',
        borderRadius: Radius.md,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        gap: Spacing.sm,
    },
    pairedIcon: {
        fontSize: 18,
    },
    pairedText: {
        ...Typography.bodySemiBold,
        fontSize: 14,
        color: Colors.success,
    },
    codeLoading: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    codeContainer: {
        alignItems: 'center',
        backgroundColor: 'rgba(108, 61, 184, 0.08)',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: 'rgba(108, 61, 184, 0.2)',
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    codeLabel: {
        ...Typography.caption,
        fontSize: 11,
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: Spacing.sm,
    },
    codeText: {
        ...Typography.heading,
        fontSize: 26,
        color: Colors.lavender,
        letterSpacing: 3,
    },
    modalActions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: Radius.lg,
        gap: Spacing.sm,
    },
    copyButton: {
        backgroundColor: 'rgba(108, 61, 184, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(108, 61, 184, 0.3)',
    },
    shareButton: {
        backgroundColor: 'rgba(199, 125, 184, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(199, 125, 184, 0.3)',
    },
    actionIcon: {
        fontSize: 18,
    },
    actionText: {
        ...Typography.bodySemiBold,
        fontSize: 14,
        color: Colors.textPrimary,
    },
    copiedText: {
        color: Colors.success,
    },
});
