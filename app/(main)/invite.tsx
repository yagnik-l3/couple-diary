import GlassCard from '@/components/GlassCard';
import GlowButton from '@/components/GlowButton';
import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAppState } from '@/utils/store';
import { getInviteCode, joinPartner, supabase } from '@/utils/supabase';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';

export default function InviteScreen() {
    const router = useRouter();
    const { update } = useAppState();
    const [myCode, setMyCode] = useState('');
    const [partnerCode, setPartnerCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const [connected, setConnected] = useState(false);

    // Load user's invite code
    useEffect(() => {
        (async () => {
            try {
                const code = await getInviteCode();
                setMyCode(code || '');
            } catch {
                setMyCode('');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Realtime: listen for partner connecting to us
    useEffect(() => {
        let channel: ReturnType<typeof supabase.channel> | null = null;

        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            channel = supabase
                .channel('partner-connect')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${user.id}`,
                    },
                    (payload) => {
                        const newCoupleId = (payload.new as any)?.couple_id;
                        if (newCoupleId) {
                            // Partner connected!
                            update({ hasPartner: true });
                            setConnected(true);
                            setTimeout(() => {
                                router.replace('/(main)/home');
                            }, 2500);
                        }
                    }
                )
                .subscribe();
        })();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, []);

    const handleCopy = async () => {
        if (!myCode) return;
        await Clipboard.setStringAsync(myCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    const handleShare = async () => {
        if (!myCode) return;
        try {
            await Share.share({
                message: `Join me on Couple Diary! 💕\n\nUse my invite code: ${myCode}\n\nDownload the app and enter this code to connect with me ✨`,
            });
        } catch { }
    };

    const handleJoin = async () => {
        const code = partnerCode.trim().toUpperCase();
        if (code.length < 4) {
            setError('Please enter a valid invite code');
            return;
        }

        setJoining(true);
        setError('');
        try {
            const result = await joinPartner(code);
            update({ hasPartner: true, partnerName: result.partnerName || 'Partner' });
            setConnected(true);
            // Navigate to home after a brief celebration
            setTimeout(() => {
                router.replace('/(main)/home');
            }, 2500);
        } catch (err: any) {
            setError(err.message || 'Failed to connect. Please check the code.');
        } finally {
            setJoining(false);
        }
    };

    // ─── Connected celebration ───────────────────────
    if (connected) {
        return (
            <GradientBackground variant="full">
                <StarBackground />
                <View style={styles.centered}>
                    <Animated.View entering={ZoomIn.duration(600)}>
                        <Text style={styles.celebrationEmoji}>💞</Text>
                    </Animated.View>
                    <Animated.View entering={FadeInUp.delay(400).duration(600)}>
                        <Text style={styles.celebrationTitle}>Connected!</Text>
                        <Text style={styles.celebrationSub}>Your journey together begins now ✨</Text>
                    </Animated.View>
                </View>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground variant="full">
            <StarBackground />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.header}>
                        <Text style={styles.headerEmoji}>💌</Text>
                        <Text style={styles.title}>Connect with{'\n'}Your Partner</Text>
                        <Text style={styles.subtitle}>
                            Share your code or enter your partner's code to start your journey together
                        </Text>
                    </Animated.View>

                    {/* Your Code Section */}
                    <Animated.View entering={FadeInUp.delay(400).duration(600)}>
                        <GlassCard style={styles.codeSection}>
                            <Text style={styles.sectionLabel}>YOUR INVITE CODE</Text>
                            {loading ? (
                                <ActivityIndicator size="small" color={Colors.softPink} style={{ marginVertical: Spacing.lg }} />
                            ) : (
                                <View style={styles.codeDisplay}>
                                    <Text style={styles.codeText}>{myCode || '------'}</Text>
                                </View>
                            )}
                            <View style={styles.codeActions}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.copyBtn]}
                                    onPress={handleCopy}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.actionIcon}>{copied ? '✓' : '📋'}</Text>
                                    <Text style={[styles.actionLabel, copied && styles.copiedLabel]}>
                                        {copied ? 'Copied!' : 'Copy'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.shareBtn]}
                                    onPress={handleShare}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.actionIcon}>📤</Text>
                                    <Text style={styles.actionLabel}>Share</Text>
                                </TouchableOpacity>
                            </View>
                        </GlassCard>
                    </Animated.View>

                    {/* Divider */}
                    <Animated.View entering={FadeIn.delay(600).duration(400)} style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </Animated.View>

                    {/* Enter Partner Code */}
                    <Animated.View entering={FadeInUp.delay(700).duration(600)}>
                        <GlassCard style={styles.joinSection}>
                            <Text style={styles.sectionLabel}>ENTER PARTNER'S CODE</Text>
                            <TextInput
                                style={styles.codeInput}
                                value={partnerCode}
                                onChangeText={(t) => {
                                    setPartnerCode(t.toUpperCase());
                                    setError('');
                                }}
                                placeholder="e.g. A3X9K2"
                                placeholderTextColor={Colors.textMuted}
                                maxLength={8}
                                autoCapitalize="characters"
                                autoCorrect={false}
                            />
                            {error ? (
                                <Text style={styles.errorText}>{error}</Text>
                            ) : null}
                            <GlowButton
                                title={joining ? 'Connecting...' : 'Connect 💕'}
                                onPress={handleJoin}
                                disabled={joining || partnerCode.trim().length < 4}
                                style={styles.joinButton}
                            />
                        </GlassCard>
                    </Animated.View>

                    <View style={styles.bottomSpacer} />
                </ScrollView>
            </KeyboardAvoidingView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
    },
    celebrationEmoji: {
        fontSize: 72,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    celebrationTitle: {
        ...Typography.heading,
        fontSize: 32,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    celebrationSub: {
        ...Typography.body,
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: 80,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    headerEmoji: {
        fontSize: 48,
        marginBottom: Spacing.md,
    },
    title: {
        ...Typography.heading,
        fontSize: 28,
        textAlign: 'center',
        lineHeight: 36,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        ...Typography.body,
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: Spacing.md,
    },
    codeSection: {
        padding: Spacing.lg,
        alignItems: 'center',
    },
    sectionLabel: {
        ...Typography.caption,
        fontSize: 11,
        color: Colors.textMuted,
        letterSpacing: 1.5,
        marginBottom: Spacing.md,
    },
    codeDisplay: {
        backgroundColor: 'rgba(108, 61, 184, 0.08)',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: 'rgba(108, 61, 184, 0.2)',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xxl,
        marginBottom: Spacing.md,
    },
    codeText: {
        ...Typography.heading,
        fontSize: 28,
        color: Colors.lavender,
        letterSpacing: 4,
    },
    codeActions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: Spacing.lg,
        borderRadius: Radius.lg,
        gap: Spacing.xs,
    },
    copyBtn: {
        backgroundColor: 'rgba(108, 61, 184, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(108, 61, 184, 0.25)',
    },
    shareBtn: {
        backgroundColor: 'rgba(199, 125, 184, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(199, 125, 184, 0.25)',
    },
    actionIcon: {
        fontSize: 16,
    },
    actionLabel: {
        ...Typography.bodySemiBold,
        fontSize: 13,
        color: Colors.textPrimary,
    },
    copiedLabel: {
        color: Colors.success,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing.lg,
        paddingHorizontal: Spacing.md,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.white08,
    },
    dividerText: {
        ...Typography.bodySemiBold,
        fontSize: 12,
        color: Colors.textMuted,
        marginHorizontal: Spacing.md,
    },
    joinSection: {
        padding: Spacing.lg,
    },
    codeInput: {
        ...Typography.heading,
        fontSize: 22,
        textAlign: 'center',
        letterSpacing: 3,
        color: Colors.textPrimary,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        borderRadius: Radius.lg,
        paddingVertical: 16,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    errorText: {
        ...Typography.body,
        fontSize: 13,
        color: Colors.danger,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    joinButton: {
        width: '100%',
        marginTop: Spacing.xs,
    },
    bottomSpacer: {
        height: 40,
    },
});
