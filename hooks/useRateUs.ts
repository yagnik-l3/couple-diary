import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';

// ─── Types ────────────────────────────────────────────
type RateUsStatus = 'pending' | 'rated' | 'never';

interface RateUsData {
    status: RateUsStatus;
    remindAfter: string | null; // ISO date string
}

const STORAGE_KEY = '@rate_us_state';

const DEFAULT_DATA: RateUsData = {
    status: 'pending',
    remindAfter: null,
};

// ─── Helpers ──────────────────────────────────────────
async function read(): Promise<RateUsData> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_DATA };
        return { ...DEFAULT_DATA, ...JSON.parse(raw) };
    } catch {
        return { ...DEFAULT_DATA };
    }
}

async function write(data: RateUsData): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // ignore
    }
}

// ─── Hook ─────────────────────────────────────────────
export function useRateUs() {
    /**
     * Returns true if the Rate Us modal should be shown right now.
     * Conditions:
     *   - status is still 'pending' (user never rated or said "never")
     *   - remindAfter is null (first time) OR today is past the remind date
     */
    const shouldShow = useCallback(async (): Promise<boolean> => {
        const data = await read();
        if (data.status !== 'pending') return false;
        if (!data.remindAfter) return true;
        return new Date() >= new Date(data.remindAfter);
    }, []);

    /**
     * User tapped "Rate Now" — mark as rated, never show again.
     */
    const onRated = useCallback(async (): Promise<void> => {
        await write({ status: 'rated', remindAfter: null });
    }, []);

    /**
     * User tapped "No Thanks" — mark as never, never show again.
     */
    const onNever = useCallback(async (): Promise<void> => {
        await write({ status: 'never', remindAfter: null });
    }, []);

    /**
     * User tapped "Remind me Later" — snooze until next calendar day.
     */
    const onRemindLater = useCallback(async (): Promise<void> => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Set to midnight so "next day" means any time the following day
        tomorrow.setHours(0, 0, 0, 0);
        await write({ status: 'pending', remindAfter: tomorrow.toISOString() });
    }, []);

    return { shouldShow, onRated, onNever, onRemindLater };
}
