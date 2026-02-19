import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const getRemainingTime = () => {
    const now = new Date();
    // Calculate next 00:00 UTC
    const nextUTC = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0
    ));
    const diff = nextUTC.getTime() - now.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
        hours,
        minutes,
        seconds,
        formatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    };
};

export default function UTCCountdown() {
    const [timeLeft, setTimeLeft] = useState(getRemainingTime());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(getRemainingTime());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.icon}>🕒</Text>
            <Text style={styles.label}>Next in: </Text>
            <Text style={styles.timer}>{timeLeft.formatted}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white05,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
    },
    icon: {
        fontSize: 10,
        marginRight: 4,
    },
    label: {
        ...Typography.caption,
        fontSize: 10,
        color: Colors.textSecondary,
    },
    timer: {
        ...Typography.caption,
        fontSize: 10,
        color: Colors.textPrimary,
        fontWeight: '700',
        minWidth: 46,
    },
});
