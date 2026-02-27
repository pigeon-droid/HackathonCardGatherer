/**
 * Sort colors in WUBRG order (White, Blue, Black, Red, Green, Colorless)
 */
export const sortColors = (colors: string[]): string[] => {
  const colorOrder: Record<string, number> = { 'W': 0, 'U': 1, 'B': 2, 'R': 3, 'G': 4, 'C': 5 };
  return [...colors].sort((a, b) => (colorOrder[a] ?? 99) - (colorOrder[b] ?? 99));
};

/**
 * All valid Magic colors in WUBRG order
 */
export const ALL_COLORS = ['W', 'U', 'B', 'R', 'G', 'C'] as const;

/**
 * Color names mapped to their codes
 */
export const COLOR_NAMES: Record<string, string> = {
  'W': 'White',
  'U': 'Blue',
  'B': 'Black',
  'R': 'Red',
  'G': 'Green',
  'C': 'Colorless'
};

/**
 * All valid card rarities
 */
export const ALL_RARITIES = ['common', 'uncommon', 'rare', 'mythic'] as const;

/**
 * Rarity names mapped to their codes
 */
export const RARITY_NAMES: Record<string, string> = {
  'common': 'Common',
  'uncommon': 'Uncommon',
  'rare': 'Rare',
  'mythic': 'Mythic'
};
