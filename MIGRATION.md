# Data Migration Guide

## Multicolor Update (February 2026)

### What Changed
The card data structure has been updated to support displaying individual colors for multicolored cards:

**Before:**
```typescript
{
  color: "Multi" // Single string
}
```

**After:**
```typescript
{
  colors: ["R", "G"] // Array of color codes
}
```

### Impact
If you have cards saved in localStorage from before this update, you may need to clear your collection and re-add cards.

### How to Migrate

#### Option 1: Clear and Re-add (Recommended)
1. Go to your browser's developer console (F12)
2. Run: `localStorage.removeItem('mtgCards')`
3. Refresh the page
4. Re-add your cards from the Browse Sets tab

#### Option 2: Manual Migration Script
If you have a large collection, you can run this migration script in the browser console:

```javascript
// Get existing cards
const cards = JSON.parse(localStorage.getItem('mtgCards') || '[]');

// Migrate each card
const migratedCards = cards.map(card => {
  // Skip if already migrated
  if (Array.isArray(card.colors)) return card;
  
  // Convert old color to colors array
  let colors = [];
  if (card.color === 'White') colors = ['W'];
  else if (card.color === 'Blue') colors = ['U'];
  else if (card.color === 'Black') colors = ['B'];
  else if (card.color === 'Red') colors = ['R'];
  else if (card.color === 'Green') colors = ['G'];
  else if (card.color === 'Colorless') colors = [];
  else if (card.color === 'Multi') {
    // Multi-color cards need to be re-fetched from Scryfall
    // For now, just mark them as colorless
    colors = [];
  }
  
  // Create new card object without old 'color' field
  const { color, ...rest } = card;
  return { ...rest, colors };
});

// Save migrated cards
localStorage.setItem('mtgCards', JSON.stringify(migratedCards));

console.log('Migration complete! Refresh the page.');
```

**Note:** The migration script will lose color information for multicolored cards. For best results, use Option 1 and re-add your cards.

### What You'll See
- Single-color cards: Display one color badge (W, U, B, R, or G)
- Colorless cards: Display "C" badge
- Multicolored cards: Display multiple color badges in WUBRG order (e.g., a Boros card shows "W" then "R", a Sultai card shows "U", "B", "G")
- Colors always appear in the standard Magic order: White, Blue, Black, Red, Green, Colorless

### Color Filter Updates
The color filter buttons now use color codes:
- **W** = White
- **U** = Blue
- **B** = Black
- **R** = Red
- **G** = Green
- **C** = Colorless

Filtering by a color will show all cards that include that color, including multicolored cards.

