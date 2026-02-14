import FloatingCard from '@/components/FloatingCard';
import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import ToggleSwitch from '@/components/ToggleSwitch';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAppState } from '@/utils/store';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    const { reset } = useAppState();
    const [notifications, setNotifications] = useState(true);
    const [dailyReminder, setDailyReminder] = useState(true);
    const [soundEffects, setSoundEffects] = useState(true);
    const [haptics, setHaptics] = useState(true);

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
                        <SettingRow icon="👤" label="Edit Profile" onPress={() => router.push('/(main)/profile')} showArrow />
                        <View style={styles.rowDivider} />
                        <SettingRow icon="💌" label="Invite Partner" onPress={() => Alert.alert('Invite Code', 'LOVE-2024-STARS\n\nShare this code with your partner!')} showArrow />
                        <View style={styles.rowDivider} />
                        {/* <SettingRow icon="🔒" label="Change Password" onPress={() => { }} showArrow /> */}
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
                        <View style={styles.rowDivider} />
                        {/* <SettingRow icon="🗑️" label="Clear Cache" onPress={() => { }} showArrow /> */}
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
});
