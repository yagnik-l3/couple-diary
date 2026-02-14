export interface CoupleLevel {
    level: number;
    minStreak: number;
    title: string;
    icon: string;
    description: string;
    color: string;
}

export const COUPLE_LEVELS: CoupleLevel[] = [
    { level: 1, minStreak: 0, title: 'Stargazers', icon: '🌟', description: 'Just beginning your cosmic journey', color: '#F5D08A' },
    { level: 2, minStreak: 7, title: 'Nebula Explorers', icon: '🌙', description: 'Your light grows stronger together', color: '#B8A9E8' },
    { level: 3, minStreak: 14, title: 'Galaxy Builders', icon: '🪐', description: 'Building worlds with your love', color: '#9B4DCA' },
    { level: 4, minStreak: 30, title: 'Constellation Makers', icon: '⭐', description: 'Your bond paints the sky', color: '#E86A9E' },
    { level: 5, minStreak: 60, title: 'Cosmic Lovers', icon: '🌌', description: 'Your universe shines bright', color: '#6C3DB8' },
    { level: 6, minStreak: 100, title: 'Universe Creators', icon: '💫', description: 'Eternal love, infinite stars', color: '#FF8C42' },
];

export function getLevelForStreak(streak: number): CoupleLevel {
    let current = COUPLE_LEVELS[0];
    for (const level of COUPLE_LEVELS) {
        if (streak >= level.minStreak) {
            current = level;
        }
    }
    return current;
}

export function getNextLevel(streak: number): CoupleLevel | null {
    for (const level of COUPLE_LEVELS) {
        if (streak < level.minStreak) {
            return level;
        }
    }
    return null; // Max level reached
}

export function getStreakProgress(streak: number): number {
    const current = getLevelForStreak(streak);
    const next = getNextLevel(streak);
    if (!next) return 1; // Max level
    const range = next.minStreak - current.minStreak;
    const progress = streak - current.minStreak;
    return progress / range;
}
