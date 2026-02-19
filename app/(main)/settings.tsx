import ActionSheet from '@/components/ActionSheet';
import FloatingCard from '@/components/FloatingCard';
import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import ToggleSwitch from '@/components/ToggleSwitch';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAppState } from '@/utils/store';
import { deleteUserAccount, getInviteCode, signOut } from '@/utils/supabase';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
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

    // Action Sheet state
    const [actionSheet, setActionSheet] = useState<{
        visible: boolean;
        type: 'logout' | 'delete' | null;
    }>({ visible: false, type: null });
    const [actionLoading, setActionLoading] = useState(false);

    const isPaired = state.hasPartner;

    const handleConfirmAction = useCallback(async () => {
        setActionLoading(true);
        try {
            if (actionSheet.type === 'logout') {
                await signOut();
                reset();
                router.replace('/onboarding');
            } else if (actionSheet.type === 'delete') {
                await deleteUserAccount();
                reset();
                router.replace('/onboarding');
            }
            setActionSheet({ visible: false, type: null });
        } catch (error) {
            console.error('Action failed:', error);
            // Maybe add an alert here
        } finally {
            setActionLoading(false);
        }
    }, [actionSheet.type, reset, router]);

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
                        {/* <SettingRow icon="💌" label="Invite Partner" onPress={openInviteModal} showArrow /> */}
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
                        {/* <SettingRow
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
                        /> */}
                    </FloatingCard>
                </Animated.View>

                {/* Preferences */}
                <Animated.View entering={FadeInUp.delay(300).duration(500)}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <FloatingCard style={styles.sectionCard}>
                        {/* <SettingRow icon="🎨" label="Theme Selection" onPress={() => { }} showArrow /> */}
                        {/* <View style={styles.rowDivider} /> */}
                        <SettingRow icon="🔐" label="Privacy" onPress={() => { }} showArrow />
                    </FloatingCard>
                </Animated.View>

                {/* Data */}
                <Animated.View entering={FadeInUp.delay(400).duration(500)}>
                    <Text style={styles.sectionTitle}>Data</Text>
                    <FloatingCard style={styles.sectionCard}>
                        <SettingRow icon="📦" label="Export Memories" onPress={() => { }} showArrow />
                        <View style={styles.rowDivider} />
                        <SettingRow icon="📦" label="Export Journal" onPress={() => { }} showArrow />
                    </FloatingCard>
                </Animated.View>

                {/* Danger Zone */}
                <Animated.View entering={FadeInUp.delay(500).duration(500)}>
                    <Text style={styles.sectionTitle}>Danger Zone</Text>
                    <FloatingCard style={{ ...styles.sectionCard, ...styles.dangerCard }}>
                        <SettingRow
                            icon="🚪"
                            label="Log Out"
                            onPress={() => setActionSheet({ visible: true, type: 'logout' })}
                            danger
                            showArrow
                        />
                        <SettingRow
                            icon="🗑️"
                            label="Delete Account"
                            onPress={() => setActionSheet({ visible: true, type: 'delete' })}
                            danger
                            showArrow
                        />
                    </FloatingCard>
                </Animated.View>

                {/* Version */}
                <Text style={styles.versionText}>Couple Diary v1.0.0 ✨</Text>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* ─── Action Sheet ───────────────────────────────── */}
            <ActionSheet
                visible={actionSheet.visible}
                onClose={() => setActionSheet(prev => ({ ...prev, visible: false }))}
                title={actionSheet.type === 'logout' ? 'Log Out' : 'Delete Account'}
                message={
                    actionSheet.type === 'logout'
                        ? 'Are you sure you want to log out?'
                        : 'Are you sure you want to delete your account? This action cannot be undone.'
                }
                icon={actionSheet.type === 'logout' ? '🚪' : '🗑️'}
                confirmLabel={actionSheet.type === 'logout' ? 'Log Out' : 'Delete Account'}
                onConfirm={handleConfirmAction}
                isDestructive
                loading={actionLoading}
            />
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Spacing.xs,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    backText: {
        ...Typography.body,
        color: Colors.textSecondary,
        fontSize: Typography.md.fontSize,
    },
    headerTitle: {
        ...Typography.bodySemiBold,
        fontSize: Typography.h3.fontSize,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
    },
    sectionTitle: {
        ...Typography.bodySemiBold,
        fontSize: Typography.md.fontSize,
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
        fontSize: Typography.xl.fontSize,
        width: 28,
        textAlign: 'center',
    },
    settingLabel: {
        ...Typography.bodyMedium,
        fontSize: Typography.md.fontSize,
        flex: 1,
    },
    arrow: {
        ...Typography.body,
        fontSize: Typography.xl.fontSize,
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
        fontSize: Typography.sm.fontSize,
        textAlign: 'center',
        marginTop: Spacing.xl,
        color: Colors.textMuted,
    },
    bottomSpacer: {
        height: 60,
    },
});
