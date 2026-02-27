import React, { useState } from 'react';
import Card from '../types/Card';
import { sortColors, ALL_COLORS, COLOR_NAMES, ALL_RARITIES, RARITY_NAMES } from '../utils/colorUtils';
import { openScryfallCard } from '../utils/scryfallUtils';
import '../styles/CardList.css';

interface CardListProps {
  cards: Card[];
  onRemoveCard: (id: number) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
}

type SortMode = 'default' | 'price-asc' | 'price-desc';
type DisplayMode = 'grouped' | 'flat';

const CardList: React.FC<CardListProps> = ({ cards, onRemoveCard, onUpdateQuantity }) => {
  const [nameQuery, setNameQuery] = useState('');
  const [setQuery, setSetQuery] = useState('');
  const [typeQuery, setTypeQuery] = useState('');
  const [oracleQuery, setOracleQuery] = useState('');
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set());
  const [hiddenSets, setHiddenSets] = useState<Set<string>>(new Set());
  const [faceOverrides, setFaceOverrides] = useState<Record<number, number>>({});
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grouped');
  const [foilAnimated, setFoilAnimated] = useState(true);


  const toggleColor = (color: string) => {
    const newColors = new Set(selectedColors);
    if (newColors.has(color)) {
      newColors.delete(color);
    } else {
      newColors.add(color);
    }
    setSelectedColors(newColors);
  };

  const toggleRarity = (rarity: string) => {
    const newRarities = new Set(selectedRarities);
    if (newRarities.has(rarity)) {
      newRarities.delete(rarity);
    } else {
      newRarities.add(rarity);
    }
    setSelectedRarities(newRarities);
  };

  const filteredCards = cards.filter(card => {
    // Rarity filter
    if (selectedRarities.size > 0) {
      const cardRarity = card.rarity?.toLowerCase();
      if (!cardRarity || !selectedRarities.has(cardRarity)) {
        return false;
      }
    }

    // Color filter
    if (selectedColors.size > 0) {
      // For colorless cards
      if (card.colors.length === 0 && !selectedColors.has('C')) {
        return false;
      }
      // For colored cards, check if any selected color matches
      if (card.colors.length > 0) {
        const hasMatchingColor = card.colors.some(color => selectedColors.has(color));
        if (!hasMatchingColor) {
          return false;
        }
      }
    }

    const nameTerm = nameQuery.trim().toLowerCase();
    if (nameTerm && !card.name.toLowerCase().includes(nameTerm)) {
      return false;
    }

    const setTerm = setQuery.trim().toLowerCase();
    if (setTerm) {
      const matchesSetName = card.setName.toLowerCase().includes(setTerm);
      const matchesSetCode = card.set.toLowerCase().includes(setTerm);
      if (!matchesSetName && !matchesSetCode) {
        return false;
      }
    }

    const typeTerm = typeQuery.trim().toLowerCase();
    if (typeTerm && !card.type.toLowerCase().includes(typeTerm)) {
      return false;
    }

    const oracleTerm = oracleQuery.trim().toLowerCase();
    if (oracleTerm) {
      const oracleText = card.oracleText?.toLowerCase() || '';
      if (!oracleText.includes(oracleTerm)) {
        return false;
      }
    }

    return true;
  });

  // Apply sorting
  const sortedAndFilteredCards = (() => {
    const cardsCopy = [...filteredCards];
    if (sortMode === 'price-asc') {
      return cardsCopy.sort((a, b) => {
        const priceA = a.priceEur || 0;
        const priceB = b.priceEur || 0;
        return priceA - priceB;
      });
    } else if (sortMode === 'price-desc') {
      return cardsCopy.sort((a, b) => {
        const priceA = a.priceEur || 0;
        const priceB = b.priceEur || 0;
        return priceB - priceA;
      });
    } else if (sortMode === 'default' && displayMode === 'flat') {
      // Sort alphabetically by card name in flat view
      return cardsCopy.sort((a, b) => a.name.localeCompare(b.name));
    }
    return cardsCopy;
  })();

  if (cards.length === 0) {
    return (
      <div className="empty-state">
        <p>📚 No cards in your collection yet</p>
        <p className="empty-subtitle">Browse sets and click cards to add them!</p>
      </div>
    );
  }

  // Group cards by set only in grouped display mode
  const cardsBySet = displayMode === 'grouped'
    ? sortedAndFilteredCards.reduce((acc, card) => {
        if (!acc[card.setName]) {
          acc[card.setName] = [];
        }
        acc[card.setName].push(card);
        return acc;
      }, {} as Record<string, Card[]>)
    : {};

  const sortSetsByRelease = (entries: Array<[string, Card[]]>) => {
    return [...entries].sort(([, aCards], [, bCards]) => {
      const aDate = aCards[0]?.setReleasedAt ? new Date(aCards[0].setReleasedAt) : null;
      const bDate = bCards[0]?.setReleasedAt ? new Date(bCards[0].setReleasedAt) : null;

      if (aDate && bDate) {
        return bDate.getTime() - aDate.getTime();
      }
      if (aDate) {
        return -1;
      }
      if (bDate) {
        return 1;
      }
      return 0;
    });
  };

  const sortByCollectorNumber = (items: Card[]) => {
    return [...items].sort((a, b) => {
      const aNum = parseInt(a.collectorNumber, 10);
      const bNum = parseInt(b.collectorNumber, 10);

      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
        return aNum - bNum;
      }
      if (!Number.isNaN(aNum)) {
        return -1;
      }
      if (!Number.isNaN(bNum)) {
        return 1;
      }
      return a.collectorNumber.localeCompare(b.collectorNumber, undefined, { numeric: true });
    });
  };

  const sortSetCards = (cards: Card[]): Card[] => {
    if (sortMode === 'price-asc') {
      return [...cards].sort((a, b) => {
        const priceA = a.priceEur || 0;
        const priceB = b.priceEur || 0;
        return priceA - priceB;
      });
    } else if (sortMode === 'price-desc') {
      return [...cards].sort((a, b) => {
        const priceA = a.priceEur || 0;
        const priceB = b.priceEur || 0;
        return priceB - priceA;
      });
    }
    // Default: sort by collector number
    return sortByCollectorNumber(cards);
  };

  const toggleHiddenSet = (setName: string) => {
    const next = new Set(hiddenSets);
    if (next.has(setName)) {
      next.delete(setName);
    } else {
      next.add(setName);
    }
    setHiddenSets(next);
  };

  const toggleFace = (cardId: number) => {
    setFaceOverrides(prev => {
      const current = prev[cardId] ?? 0;
      return { ...prev, [cardId]: current === 0 ? 1 : 0 };
    });
  };

  const visibleEntries = sortSetsByRelease(Object.entries(cardsBySet))
    .filter(([setName]) => !hiddenSets.has(setName));

  const hiddenEntries = sortSetsByRelease(Object.entries(cardsBySet))
    .filter(([setName]) => hiddenSets.has(setName));

  // Calculate total collection value
  const totalValue = sortedAndFilteredCards.reduce((sum, card) => {
    const cardValue = (card.priceEur || 0) * card.quantity;
    return sum + cardValue;
  }, 0);

  return (
    <div className="card-collection">
      <div className="collection-header">
        <h2>Your Collection</h2>
        <div className="collection-stats">
          <span>Showing {sortedAndFilteredCards.length} of {cards.length} cards</span>
          {totalValue > 0 && (
            <span className="collection-value">
              Total Value: €{totalValue.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      <div className="collection-filters">
        <div className="search-grid">
          <div className="search-field">
            <label className="search-label" htmlFor="search-name">Name</label>
            <input
              id="search-name"
              type="text"
              className="search-input"
              placeholder="e.g. Lightning Bolt"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
            />
          </div>
          <div className="search-field">
            <label className="search-label" htmlFor="search-set">Set (name/code)</label>
            <input
              id="search-set"
              type="text"
              className="search-input"
              placeholder="e.g. Modern Horizons or mh2"
              value={setQuery}
              onChange={(e) => setSetQuery(e.target.value)}
            />
          </div>
          <div className="search-field">
            <label className="search-label" htmlFor="search-type">Type</label>
            <input
              id="search-type"
              type="text"
              className="search-input"
              placeholder="e.g. Creature"
              value={typeQuery}
              onChange={(e) => setTypeQuery(e.target.value)}
            />
          </div>
          <div className="search-field">
            <label className="search-label" htmlFor="search-oracle">Oracle text</label>
            <input
              id="search-oracle"
              type="text"
              className="search-input"
              placeholder="e.g. draw a card"
              value={oracleQuery}
              onChange={(e) => setOracleQuery(e.target.value)}
            />
          </div>
        </div>
        {(nameQuery || setQuery || typeQuery || oracleQuery) && (
          <button
            className="clear-search"
            onClick={() => {
              setNameQuery('');
              setSetQuery('');
              setTypeQuery('');
              setOracleQuery('');
            }}
          >
            Clear search
          </button>
        )}

        <div className="color-filters">
          <span className="filter-label">Colors:</span>
          <div className="color-buttons">
            {ALL_COLORS.map(color => (
              <button
                key={color}
                className={`color-filter-btn color-${color.toLowerCase()} ${selectedColors.has(color) ? 'active' : ''}`}
                onClick={() => toggleColor(color)}
                title={COLOR_NAMES[color]}
              >
                {color}
              </button>
            ))}
          </div>
          {selectedColors.size > 0 && (
            <button
              className="clear-filters"
              onClick={() => setSelectedColors(new Set())}
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="rarity-filters">
          <span className="filter-label">Rarity:</span>
          <div className="rarity-buttons">
            {ALL_RARITIES.map(rarity => (
              <button
                key={rarity}
                className={`rarity-filter-btn rarity-${rarity} ${selectedRarities.has(rarity) ? 'active' : ''}`}
                onClick={() => toggleRarity(rarity)}
                title={RARITY_NAMES[rarity]}
              >
                {RARITY_NAMES[rarity]}
              </button>
            ))}
          </div>
          {selectedRarities.size > 0 && (
            <button
              className="clear-filters"
              onClick={() => setSelectedRarities(new Set())}
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="sort-options">
          <span className="filter-label">Sort by:</span>
          <div className="sort-buttons">
            <button
              className={`sort-btn ${sortMode === 'default' ? 'active' : ''}`}
              onClick={() => setSortMode('default')}
              title="Default sorting (by set and collector number)"
            >
              Default
            </button>
            <button
              className={`sort-btn ${sortMode === 'price-asc' ? 'active' : ''}`}
              onClick={() => setSortMode('price-asc')}
              title="Sort by price ascending (lowest first)"
            >
              Price ↑
            </button>
            <button
              className={`sort-btn ${sortMode === 'price-desc' ? 'active' : ''}`}
              onClick={() => setSortMode('price-desc')}
              title="Sort by price descending (highest first)"
            >
              Price ↓
            </button>
          </div>
        </div>

        <div className="display-options">
          <span className="filter-label">Display:</span>
          <div className="display-buttons">
            <button
              className={`display-btn ${displayMode === 'grouped' ? 'active' : ''}`}
              onClick={() => setDisplayMode('grouped')}
              title="Group cards by set"
            >
              By Set
            </button>
            <button
              className={`display-btn ${displayMode === 'flat' ? 'active' : ''}`}
              onClick={() => setDisplayMode('flat')}
              title="Display all cards together"
            >
              All Together
            </button>
          </div>
        </div>

        <div className="display-options">
          <span className="filter-label">Foil Shimmer:</span>
          <div className="display-buttons">
            <button
              className={`display-btn ${foilAnimated ? 'active' : ''}`}
              onClick={() => setFoilAnimated(true)}
              title="Animated foil shimmer effect"
            >
              Animated
            </button>
            <button
              className={`display-btn ${!foilAnimated ? 'active' : ''}`}
              onClick={() => setFoilAnimated(false)}
              title="Static foil shimmer effect"
            >
              Static
            </button>
          </div>
        </div>
      </div>

      {Object.keys(cardsBySet).length === 0 && displayMode === 'grouped' && (
        <div className="no-results">
          <p>No cards match your search criteria</p>
          <button
            className="reset-filters-btn"
            onClick={() => {
              setNameQuery('');
              setSetQuery('');
              setTypeQuery('');
              setOracleQuery('');
              setSelectedColors(new Set());
            }}
          >
            Reset all filters
          </button>
        </div>
      )}

      {displayMode === 'flat' && sortedAndFilteredCards.length === 0 && (
        <div className="no-results">
          <p>No cards match your search criteria</p>
          <button
            className="reset-filters-btn"
            onClick={() => {
              setNameQuery('');
              setSetQuery('');
              setTypeQuery('');
              setOracleQuery('');
              setSelectedColors(new Set());
            }}
          >
            Reset all filters
          </button>
        </div>
      )}

      {displayMode === 'flat' && sortedAndFilteredCards.length > 0 && (
        <div className="set-cards-grid">
          {sortedAndFilteredCards.map(card => {
            const sortedColors = card.colors.length === 0 ? [] : sortColors(card.colors);
            const faces = card.cardFaces || [];
            const faceIndex = faceOverrides[card.id] ?? 0;
            const faceImage = faces[faceIndex]?.imageUrl || card.imageUrl;
            return (
              <div
                key={card.id}
                className={`collection-card ${card.isFoil ? 'foil-mode' : ''} ${card.isFoil && !foilAnimated ? 'foil-static' : ''}`}
              >
                <div className="card-image-container">
                  <img
                   src={faceImage}
                    alt={card.name}
                    className={`card-image ${card.isFoil ? 'foil-effect' : ''}`}
                    onClick={() => {
                      openScryfallCard(card.set, card.collectorNumber);
                    }}
                    style={{ cursor: 'pointer' }}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        openScryfallCard(card.set, card.collectorNumber);
                      }
                    }}
                  />
                 {faces.length > 1 && (
                   <button
                     type="button"
                     className="card-flip-btn"
                     onClick={(event) => {
                       event.stopPropagation();
                       toggleFace(card.id);
                     }}
                   >
                     Flip
                   </button>
                 )}
                </div>
                <div className="card-details">
                  <div
                    className="card-name"
                    onClick={() => {
                      openScryfallCard(card.set, card.collectorNumber);
                    }}
                    style={{ cursor: 'pointer' }}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        openScryfallCard(card.set, card.collectorNumber);
                      }
                    }}
                  >
                    {card.name}
                    {card.isFoil && <span className="foil-indicator">✨</span>}
                  </div>
                  <div className="card-type">{card.type}</div>
                  <div className="card-meta">
                    <div className="color-badges-container">
                      {sortedColors.length === 0 ? (
                        <span className="color-badge color-c">C</span>
                      ) : (
                        sortedColors.map(color => (
                          <span key={color} className={`color-badge color-${color.toLowerCase()}`}>
                            {color}
                          </span>
                        ))
                      )}
                    </div>
                    {card.rarity && (
                      <span className={`rarity-badge rarity-${card.rarity.toLowerCase()}`}>
                        {card.rarity}
                      </span>
                    )}
                    {card.isFoil && (
                      <span className="foil-badge">Foil</span>
                    )}
                    <span className="card-number">#{card.collectorNumber}</span>
                  </div>
                  {card.priceEur !== undefined && (
                    <div className="card-price">
                      <span className="price-label">Price:</span>
                      <span className="price-value">€{card.priceEur.toFixed(2)}</span>
                      {card.quantity > 1 && (
                        <span className="price-total">
                          (€{(card.priceEur * card.quantity).toFixed(2)} total)
                        </span>
                      )}
                    </div>
                  )}
                  <div className="card-controls">
                    <div className="quantity-control">
                      <button
                        onClick={() => onUpdateQuantity(card.id, Math.max(1, card.quantity - 1))}
                        className="qty-btn"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={card.quantity}
                        onChange={(e) => onUpdateQuantity(card.id, parseInt(e.target.value) || 1)}
                        className="quantity-input"
                      />
                      <button
                        onClick={() => onUpdateQuantity(card.id, card.quantity + 1)}
                        className="qty-btn"
                      >
                        +
                      </button>
                      <button
                        onClick={() => onRemoveCard(card.id)}
                        className="delete-btn"
                        title="Remove card"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {displayMode === 'grouped' && hiddenEntries.length > 0 && (
        <div className="hidden-sets">
          <div className="hidden-sets-header">
            <span className="hidden-sets-title">Hidden sets</span>
            <button
              className="hidden-sets-show-all"
              onClick={() => setHiddenSets(new Set())}
            >
              Show all
            </button>
          </div>
          <div className="hidden-sets-list">
            {hiddenEntries.map(([setName]) => (
              <button
                key={setName}
                className="hidden-set-pill"
                onClick={() => toggleHiddenSet(setName)}
              >
                {setName}
              </button>
            ))}
          </div>
        </div>
      )}

      {displayMode === 'grouped' && visibleEntries.map(([setName, setCards]) => (
        <div key={setName} className="set-group">
          <div className="set-group-header-row">
            <h3 className="set-group-header">{setName}</h3>
            <button
              className="hide-set-btn"
              onClick={() => toggleHiddenSet(setName)}
            >
              Hide
            </button>
          </div>
          <div className="set-cards-grid">
            {sortSetCards(setCards).map(card => {
               const sortedColors = card.colors.length === 0 ? [] : sortColors(card.colors);
               const faces = card.cardFaces || [];
               const faceIndex = faceOverrides[card.id] ?? 0;
               const faceImage = faces[faceIndex]?.imageUrl || card.imageUrl;
                return (
                  <div
                    key={card.id}
                    className={`collection-card ${card.isFoil ? 'foil-mode' : ''} ${card.isFoil && !foilAnimated ? 'foil-static' : ''}`}
                  >
                    <div className="card-image-container">
                      <img
                       src={faceImage}
                        alt={card.name}
                        className={`card-image ${card.isFoil ? 'foil-effect' : ''}`}
                        onClick={() => {
                          openScryfallCard(card.set, card.collectorNumber);
                        }}
                        style={{ cursor: 'pointer' }}
                        role="link"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            openScryfallCard(card.set, card.collectorNumber);
                          }
                        }}
                      />
                     {faces.length > 1 && (
                       <button
                         type="button"
                         className="card-flip-btn"
                         onClick={(event) => {
                           event.stopPropagation();
                           toggleFace(card.id);
                         }}
                       >
                         Flip
                       </button>
                     )}
                    </div>
                    <div className="card-details">
                      <div
                        className="card-name"
                        onClick={() => {
                          openScryfallCard(card.set, card.collectorNumber);
                        }}
                        style={{ cursor: 'pointer' }}
                        role="link"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            openScryfallCard(card.set, card.collectorNumber);
                          }
                        }}
                      >
                        {card.name}
                        {card.isFoil && <span className="foil-indicator">✨</span>}
                      </div>
                      <div className="card-type">{card.type}</div>
                      <div className="card-meta">
                        <div className="color-badges-container">
                          {sortedColors.length === 0 ? (
                            <span className="color-badge color-c">C</span>
                          ) : (
                            sortedColors.map(color => (
                              <span key={color} className={`color-badge color-${color.toLowerCase()}`}>
                                {color}
                              </span>
                            ))
                          )}
                        </div>
                        {card.rarity && (
                          <span className={`rarity-badge rarity-${card.rarity.toLowerCase()}`}>
                            {card.rarity}
                          </span>
                        )}
                        {card.isFoil && (
                          <span className="foil-badge">Foil</span>
                        )}
                        <span className="card-number">#{card.collectorNumber}</span>
                      </div>
                      {card.priceEur !== undefined && (
                        <div className="card-price">
                          <span className="price-label">Price:</span>
                          <span className="price-value">€{card.priceEur.toFixed(2)}</span>
                          {card.quantity > 1 && (
                            <span className="price-total">
                              (€{(card.priceEur * card.quantity).toFixed(2)} total)
                            </span>
                          )}
                        </div>
                      )}
                      <div className="card-controls">
                        <div className="quantity-control">
                          <button
                            onClick={() => onUpdateQuantity(card.id, Math.max(1, card.quantity - 1))}
                            className="qty-btn"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={card.quantity}
                            onChange={(e) => onUpdateQuantity(card.id, parseInt(e.target.value) || 1)}
                            className="quantity-input"
                          />
                          <button
                            onClick={() => onUpdateQuantity(card.id, card.quantity + 1)}
                            className="qty-btn"
                          >
                            +
                          </button>
                          <button
                            onClick={() => onRemoveCard(card.id)}
                            className="delete-btn"
                            title="Remove card"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
  );
};

export default CardList;

