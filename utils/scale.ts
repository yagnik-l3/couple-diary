import { Dimensions } from 'react-native';

// ─── Base Dimensions (iPhone 13) ─────────────────────
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const scaleWidth = SCREEN_WIDTH / BASE_WIDTH;
const scaleHeight = SCREEN_HEIGHT / BASE_HEIGHT;
const minScale = Math.min(scaleWidth, scaleHeight);

/**
 * Horizontal scale — linearly scales a value based on screen width
 * Use for: horizontal paddings, margins, widths, icon sizes
 */
export function scale(size: number): number {
    return Math.round(minScale * size);
}


// Short aliases
export const s = scale;

// Screen dimensions for reference
export const SCREEN = {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isSmall: SCREEN_WIDTH < 375, // iPhone SE
    isLarge: SCREEN_WIDTH >= 414, // iPhone Plus / Max
};
