/**
 * Scryfall card URL utilities
 */

const SCRYFALL_BASE_URL = 'https://scryfall.com/card';

/**
 * Build a Scryfall card URL from set code and collector number
 */
export const buildScryfallUrl = (setCode: string, collectorNumber: string): string => {
  return `${SCRYFALL_BASE_URL}/${setCode.toLowerCase()}/${collectorNumber}`;
};

/**
 * Open a Scryfall card page in a new tab
 */
export const openScryfallCard = (setCode: string, collectorNumber: string): void => {
  const url = buildScryfallUrl(setCode, collectorNumber);
  window.open(url, '_blank');
};

