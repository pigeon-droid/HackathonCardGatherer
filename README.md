# MTG Collection Tracker

A simple web application to track your Magic: The Gathering collection.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The app will open automatically at `http://localhost:3000`

### Build

Create a production build:
```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Features

### Current MVP
- ✅ Browse Magic sets and add cards to collection
- ✅ Track card quantities with playset counter (1-3/4, then checkmark)
- ✅ View collection organized by set
- ✅ Search cards by name, set, type, or oracle text
- ✅ Filter collection by color (W, U, B, R, G, C)
- ✅ Visual color badges - multicolored cards show all their colors
- ✅ Tabbed interface (Browse Sets / My Collection)
- ✅ Set filtering and search
- ✅ Scryfall API integration
- ✅ Store data in browser (localStorage)
- ✅ Dark mode UI with gradient accents

### Data Structure

Each card tracks:
- **Name**: Card name
- **Set**: Edition/set the card is from (code and full name)
- **Type**: Card type (creature, artifact, instant, etc.)
- **Colors**: Array of mana colors (W, U, B, R, G, or empty for colorless)
  - Multicolored cards display all their colors individually
- **Quantity**: How many copies you have
- **Oracle Text**: Card rules text (for searching card abilities)
- **Image**: Card artwork URL from Scryfall
- **Collector Number**: Card number within the set

## Project Structure

```
src/
├── components/
│   ├── SetsBrowser.tsx      # Browse and select MTG sets
│   ├── SetsBrowser.css
│   ├── CardGallery.tsx      # Display cards from selected set
│   ├── CardGallery.css
│   ├── CardList.tsx         # Display collection with search/filters
│   └── CardList.css
├── services/
│   ├── ScryfallAPI.ts       # Scryfall API integration
│   └── RateLimiter.ts       # Rate limiting for API calls
├── types/
│   └── Card.ts              # Card type definition
├── App.tsx                  # Main app component with tabs
├── App.css
├── index.css                # Global styles
└── main.tsx                 # Entry point
```

## Planned Features

- [ ] Import/Export collection (JSON/CSV)
- [ ] Advanced sorting options
- [ ] Card pricing integration
- [ ] Deck building
- [ ] Backend sync
- [ ] User authentication
- [ ] Collection statistics and graphs
- [ ] Wishlist tracking
- [ ] Trade management

## Technology Stack

- **React 18** - UI library with TypeScript
- **Webpack** - Build tool and dev server
- **CSS** - Styling (no framework, vanilla CSS with gradients)
- **localStorage** - Client-side data persistence
- **Scryfall API** - MTG card data

## Notes

This is an iterative project. Features will be added incrementally based on needs and feedback.

