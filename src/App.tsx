import React, { useState, useEffect, lazy, Suspense } from 'react';
const SetsBrowser = lazy(() => import('./components/SetsBrowser'));
const CardGallery = lazy(() => import('./components/CardGallery'));
const CardList = lazy(() => import('./components/CardList'));
const QuickAdd = lazy(() => import('./components/QuickAdd'));
import Card from './types/Card';
import { ScryfallSet } from './services/ScryfallAPI';
import './styles/App.css';

const App: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedSet, setSelectedSet] = useState<ScryfallSet | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'collection' | 'quick-add'>('browse');
  const [hasLoaded, setHasLoaded] = useState(false);

  // Helper to sort colors in WUBRG order
  const sortColors = (colors: string[]): string[] => {
    const colorOrder: Record<string, number> = { 'W': 0, 'U': 1, 'B': 2, 'R': 3, 'G': 4 };
    return [...colors].sort((a, b) => (colorOrder[a] ?? 99) - (colorOrder[b] ?? 99));
  };

  // Load cards from localStorage on mount
  useEffect(() => {
    const savedCards = localStorage.getItem('mtgCards');
    if (savedCards) {
      const loadedCards = JSON.parse(savedCards);
      // Migrate: ensure colors are sorted in WUBRG order
      const migratedCards = loadedCards.map((card: Card) => ({
        ...card,
        colors: sortColors(card.colors || [])
      }));
      setCards(migratedCards);
    }
    setHasLoaded(true);
  }, []);

  // Save cards to localStorage whenever they change
  useEffect(() => {
    if (!hasLoaded) {
      return;
    }
    localStorage.setItem('mtgCards', JSON.stringify(cards));
  }, [cards, hasLoaded]);

  const addCard = (card: Card) => {
    // Check if card already exists (same scryfallId AND same foil status)
    const existingCard = cards.find(c =>
      c.scryfallId === card.scryfallId && c.isFoil === card.isFoil
    );

    if (existingCard) {
      // Increase quantity if it already exists
      setCards(cards.map(c =>
        c.scryfallId === card.scryfallId && c.isFoil === card.isFoil
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      // Add new card
      setCards([...cards, card]);
    }
  };

  const removeCard = (id: number) => {
    setCards(cards.filter(card => card.id !== id));
  };

  const updateCardQuantity = (id: number, newQuantity: number) => {
    setCards(cards.map(card =>
      card.id === id ? { ...card, quantity: newQuantity } : card
    ));
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🃏 MTG Collection Tracker</h1>
        <p className="subtitle">Track your Magic: The Gathering collection</p>
      </header>

      <main className="app-container">
        <div className="app-tabs" role="tablist" aria-label="Main navigation">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'browse'}
            className={`app-tab ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            Browse Sets
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'quick-add'}
            className={`app-tab ${activeTab === 'quick-add' ? 'active' : ''}`}
            onClick={() => setActiveTab('quick-add')}
          >
            Quick Add
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'collection'}
            className={`app-tab ${activeTab === 'collection' ? 'active' : ''}`}
            onClick={() => setActiveTab('collection')}
          >
            My Collection
          </button>
        </div>

        {activeTab === 'browse' && (
          <Suspense fallback={<div className="collection-section">Loading...</div>}>
            <div className={`browser-section ${selectedSet ? 'set-selected' : ''}`}>
              {selectedSet && (
                <div className="selected-set-header">
                  <button
                    className="back-to-sets-btn"
                    onClick={() => setSelectedSet(null)}
                  >
                    ← Back to Sets
                  </button>
                  <div className="selected-set-info">
                    <h3>{selectedSet.name}</h3>
                    <p>{selectedSet.code.toUpperCase()}</p>
                  </div>
                </div>
              )}
              <div className="sets-section">
                <SetsBrowser
                  onSelectSet={setSelectedSet}
                  selectedSetCode={selectedSet?.code}
                />
              </div>

              <div className="gallery-section">
                <CardGallery
                  set={selectedSet}
                  onAddCard={addCard}
                  collectionCards={cards}
                />
              </div>
            </div>
          </Suspense>
        )}

        {activeTab === 'quick-add' && (
          <Suspense fallback={<div className="collection-section">Loading...</div>}>
            <div className="collection-section">
              <QuickAdd
                onAddCard={addCard}
                collectionCards={cards}
              />
            </div>
          </Suspense>
        )}

        {activeTab === 'collection' && (
          <Suspense fallback={<div className="collection-section">Loading...</div>}>
            <div className="collection-section">
              <CardList
                cards={cards}
                onRemoveCard={removeCard}
                onUpdateQuantity={updateCardQuantity}
              />
            </div>
          </Suspense>
        )}
      </main>
    </div>
  );
};

export default App;
