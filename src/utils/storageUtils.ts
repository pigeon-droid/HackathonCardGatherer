import Card from '../types/Card';

const STORAGE_KEY = 'mtgCards';

/**
 * Load cards from localStorage
 */
export const loadCardsFromStorage = (): Card[] => {
  try {
    const savedCards = localStorage.getItem(STORAGE_KEY);
    return savedCards ? JSON.parse(savedCards) : [];
  } catch (error) {
    console.error('Failed to load cards from storage:', error);
    return [];
  }
};

/**
 * Save cards to localStorage
 */
export const saveCardsToStorage = (cards: Card[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (error) {
    console.error('Failed to save cards to storage:', error);
  }
};

