import FloatingCard from '@/components/FloatingCard';
import GlowButton from '@/components/GlowButton';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { s } from '@/utils/scale';
import React from 'react';
import {
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

interface LivesShopModalProps {
    visible: boolean;
    onClose: () => void;
    onPurchase: (amount: number) => void;
}

const PACKS = [
    { amount: 1, price: '$0.99', emoji: '❤️', label: '1 Life' },
    { amount: 3, price: '$1.99', emoji: '❤️‍🔥', label: '3 Lives', popular: true },
    { amount: 5, price: '$2.99', emoji: '💖', label: '5 Lives' },
];

export default function LivesShopModal({ visible, onClose, onPurchase }: LivesShopModalProps) {
    const handleBuy = (pack: typeof PACKS[0]) => {
        Alert.alert(
            'Purchase Simulated',
            `You bought ${pack.label} for ${pack.price}! (Mock purchase)`,
            [{ text: 'OK', onPress: () => onPurchase(pack.amount) }]
        );
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <Animated.View entering={FadeIn.duration(300)} style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <Animated.View entering={SlideInDown.delay(100).duration(400)} style={styles.sheet}>
                    <View style={styles.handle} />
                    <Text style={styles.title}>Get More Lives ❤️</Text>
                    <Text style={styles.subtitle}>
                        Protect your streak when life gets busy
                    </Text>

                    <View style={styles.packsContainer}>
                        {PACKS.map((pack) => (
                            <TouchableOpacity
                                key={pack.amount}
                                activeOpacity={0.8}
                                onPress={() => handleBuy(pack)}
                            >
                                <FloatingCard
                                    style={{
                                        ...styles.packCard,
                                        ...(pack.popular ? styles.packPopular : {}),
                                    }}
                                >
                                    {pack.popular && (
                                        <View style={styles.popularBadge}>
                                            <Text style={styles.popularText}>BEST VALUE</Text>
                                        </View>
                                    )}
                                    <Text style={styles.packEmoji}>{pack.emoji}</Text>
                                    <Text style={styles.packLabel}>{pack.label}</Text>
                                    <Text style={styles.packPrice}>{pack.price}</Text>
                                </FloatingCard>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.note}>
                        💡 You receive 1 free life every month
                    </Text>

                    <GlowButton title="Maybe Later" onPress={onClose} style={styles.closeBtn} />
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheet: {
        backgroundColor: Colors.cardBgSolid,
        borderTopLeftRadius: Radius.xxl,
        borderTopRightRadius: Radius.xxl,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xxl,
        alignItems: 'center',
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.white30,
        marginBottom: Spacing.lg,
    },
    title: {
        ...Typography.heading,
        fontSize: s(24),
        marginBottom: Spacing.xs,
    },
    subtitle: {
        ...Typography.body,
        fontSize: s(14),
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
        textAlign: 'center',
    },
    packsContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
        width: '100%',
        marginBottom: Spacing.lg,
    },
    packCard: {
        flex: 1,
        alignItems: 'center',
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    packPopular: {
        borderColor: Colors.softPink,
        borderWidth: 1,
    },
    popularBadge: {
        position: 'absolute',
        top: -10,
        backgroundColor: Colors.softPink,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Radius.full,
    },
    popularText: {
        ...Typography.bodySemiBold,
        fontSize: s(9),
        color: '#FFF',
    },
    packEmoji: {
        fontSize: s(32),
    },
    packLabel: {
        ...Typography.bodySemiBold,
        fontSize: s(14),
    },
    packPrice: {
        ...Typography.body,
        fontSize: s(13),
        color: Colors.goldSparkle,
    },
    note: {
        ...Typography.caption,
        fontSize: s(12),
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    closeBtn: {
        width: '100%',
    },
});
