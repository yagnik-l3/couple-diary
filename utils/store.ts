import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────
export interface AppState {
    // User
    userFirstName: string;
    userLastName: string;
    userId: string;
    userGender: 'male' | 'female' | 'non-binary' | 'prefer-not' | '';
    userEmail: string;
    relationshipDate: string; // ISO string
    userBirthDate: string; // ISO string

    // Partner
    hasPartner: boolean;
    partnerName: string; // Keep partnerName as is for now, or split if needed (plan said focus on user)

    // Streak & Levels
    streakCount: number;
    bestStreak: number;
    questionsAnswered: number;
    sawStreakLost: boolean;

    // Nudge
    lastNudgeAt: string; // ISO string
    nudgeNotificationsEnabled: boolean;
    dailyRemindersEnabled: boolean;
    nudgeCooldownMinutes: number;

    // Preferences
    topicPreferences: string[];
    coupleVibe: string;
    coupleEditorId: string | null;
    reminderTime: string;
    timezone: string;
    avatarUrl: string;
    partnerAvatarUrl: string;
    hasCompletedOnboarding: boolean;

    // Today
    hasAnsweredToday: boolean;
    partnerAnsweredToday: boolean;
    coupleId: string;
}

const DEFAULT_STATE: AppState = {
    userFirstName: '',
    userLastName: '',
    userId: '',
    userGender: '',
    userEmail: '',
    relationshipDate: '',
    userBirthDate: '',
    hasPartner: false,
    partnerName: '',
    streakCount: 0,
    bestStreak: 0,
    questionsAnswered: 0,
    sawStreakLost: true,
    lastNudgeAt: '',
    nudgeNotificationsEnabled: true,
    dailyRemindersEnabled: true,
    nudgeCooldownMinutes: 30,
    topicPreferences: [],
    coupleVibe: '',
    coupleEditorId: null,
    reminderTime: '',
    timezone: '',
    avatarUrl: '',
    partnerAvatarUrl: '',
    hasCompletedOnboarding: false,
    hasAnsweredToday: false,
    partnerAnsweredToday: false,
    coupleId: '',
};

const STORAGE_KEY = '@couple_diary_state';

// ─── Context ──────────────────────────────────────────
interface AppContextType {
    state: AppState;
    update: (partial: Partial<AppState>) => void;
    reset: () => void;
}

const AppContext = createContext<AppContextType>({
    state: DEFAULT_STATE,
    update: () => { },
    reset: () => { },
});

export function useAppState() {
    return useContext(AppContext);
}

// ─── Provider ─────────────────────────────────────────
export function AppStateProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AppState>({ ...DEFAULT_STATE });
    const [loaded, setLoaded] = useState(false);

    // Load from AsyncStorage
    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored) {
                    setState({ ...DEFAULT_STATE, ...JSON.parse(stored) });
                }
            } catch (e) {
                // ignore
            }
            setLoaded(true);
        })();
    }, []);

    // Persist on change
    useEffect(() => {
        if (loaded) {
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => { });
        }
    }, [state, loaded]);

    const update = useCallback((partial: Partial<AppState>) => {
        setState((prev) => ({ ...prev, ...partial }));
    }, []);

    const reset = useCallback(() => {
        setState({ ...DEFAULT_STATE });
    }, []);

    const contextValue = React.useMemo(
        () => ({ state, update, reset }),
        [state, update, reset]
    );

    return React.createElement(AppContext.Provider, { value: contextValue }, children);
}
