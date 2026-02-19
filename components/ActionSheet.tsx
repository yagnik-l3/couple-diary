import { Colors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated from 'react-native-reanimated';

interface ActionSheetProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message?: string;
    icon?: string;
    confirmLabel?: string;
    onConfirm: () => void;
    isDestructive?: boolean;
    cancelLabel?: string;
}

export default function ActionSheet({
    visible,
    onClose,
    title,
    message,
    icon = '⚠️',
    confirmLabel = 'Confirm',
    onConfirm,
    isDestructive = false,
    cancelLabel = 'Cancel',
}: ActionSheetProps) {
    if (!visible) return null;

    const renderContent = () => (
        <Animated.View
            // entering={FadeIn.duration(200)}
            // exiting={FadeOut.duration(200)}
            style={styles.sheetContainer}
        >
            {/* Glass Background */}
            <View style={styles.glassContainer}>
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={40} tint="dark" style={styles.absoluteFill} />
                ) : (
                    <View style={[styles.absoluteFill, styles.fallbackBlur]} />
                )}

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.icon}>{icon}</Text>
                    <Text style={styles.title}>{title}</Text>
                    {message && <Text style={styles.message}>{message}</Text>}

                    <View style={styles.actions}>
                        <TouchableOpacity
                            onPress={() => {
                                onConfirm();
                                onClose();
                            }}
                            activeOpacity={0.8}
                            style={styles.confirmButtonWrapper}
                        >
                            <LinearGradient
                                colors={isDestructive ? Gradients.danger : Gradients.button}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.confirmButton}
                            >
                                <Text style={styles.confirmText}>{confirmLabel}</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onClose}
                            activeOpacity={0.7}
                            style={styles.cancelButton}
                        >
                            <Text style={styles.cancelText}>{cancelLabel}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Animated.View>
    );

    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                {renderContent()}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        zIndex: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        // backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheetContainer: {
        width: '100%',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.xl + 20, // ample space from bottom
    },
    glassContainer: {
        borderRadius: Radius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        backgroundColor: 'rgba(30, 25, 60, 0.4)', // subtle tint
    },
    absoluteFill: {
        ...StyleSheet.absoluteFillObject,
    },
    fallbackBlur: {
        backgroundColor: 'rgba(18, 10, 40, 0.95)',
    },
    content: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    icon: {
        fontSize: Typography.xxxl.fontSize,
        marginBottom: Spacing.md,
    },
    title: {
        ...Typography.heading,
        fontSize: Typography.xl.fontSize,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    message: {
        ...Typography.body,
        textAlign: 'center',
        color: Colors.textSecondary,
        marginBottom: Spacing.xl,
        lineHeight: 22,
    },
    actions: {
        width: '100%',
        gap: Spacing.md,
    },
    confirmButtonWrapper: {
        width: '100%',
        borderRadius: Radius.full,
        ...StyleSheet.absoluteFillObject,
        position: 'relative',
        height: 44,
        // shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    confirmButton: {
        flex: 1,
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmText: {
        ...Typography.bodySemiBold,
        fontSize: Typography.md.fontSize,
        color: '#fff',
    },
    cancelButton: {
        width: '100%',
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Radius.full,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cancelText: {
        ...Typography.bodySemiBold,
        fontSize: Typography.md.fontSize,
        color: Colors.textSecondary,
    },
});
