import { Dimensions } from 'react-native';

// ─── Base Dimensions (iPhone 13) ─────────────────────
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Horizontal scale — linearly scales a value based on screen width
 * Use for: horizontal paddings, margins, widths, icon sizes
 */
export function scale(size: number): number {
    return (SCREEN_WIDTH / BASE_WIDTH) * size;
}

/**
 * Vertical scale — linearly scales a value based on screen height
 * Use for: vertical paddings, margins, heights, top offsets
 */
export function verticalScale(size: number): number {
    return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
}

/**
 * Moderate scale — scales with a dampening factor (default 0.5)
 * Use for: font sizes, border radius, icon sizes
 * Prevents fonts from getting too large on tablets or too small on SE
 */
export function moderateScale(size: number, factor: number = 0.5): number {
    return size + (scale(size) - size) * factor;
}

// Short aliases
export const s = scale;
export const vs = verticalScale;
export const ms = moderateScale;

// Screen dimensions for reference
export const SCREEN = {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isSmall: SCREEN_WIDTH < 375, // iPhone SE
    isLarge: SCREEN_WIDTH >= 414, // iPhone Plus / Max
};
