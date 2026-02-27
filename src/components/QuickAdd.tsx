import React, { useEffect, useState } from 'react';
import { ScryfallCard, scryfallAPI } from '../services/ScryfallAPI';
import Card from '../types/Card';
import '../styles/CardGallery.css';

interface QuickAddProps {
  onAddCard: (card: Card) => void;
  collectionCards: Card[];
}

const sortColors = (colors: string[]): string[] => {
  const colorOrder: Record<string, number> = { 'W': 0, 'U': 1, 'B': 2, 'R': 3, 'G': 4 };
  return [...colors].sort((a, b) => (colorOrder[a] ?? 99) - (colorOrder[b] ?? 99));
};

const QuickAdd: React.FC<QuickAddProps> = ({ onAddCard, collectionCards }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ScryfallCard[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchFaceOverrides, setSearchFaceOverrides] = useState<Record<string, number>>({});
  const [isFoilMode, setIsFoilMode] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const handle = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError(null);
        const query = `${searchQuery} game:paper`;
        const response = await scryfallAPI.searchCards(query, 1, 20);
        setSearchResults(response.data);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : 'Failed to search cards');
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(handle);
  }, [searchQuery]);

  const getCardQuantity = (scryfallId: string): number => {
    const card = collectionCards.find(c => c.scryfallId === scryfallId && c.isFoil === isFoilMode);
    return card ? card.quantity : 0;
  };

  const getCardColors = (card: ScryfallCard): string[] => {
    if (card.color_identity && card.color_identity.length > 0) {
      return card.color_identity;
    }
    const faceIdentity = card.card_faces?.flatMap(face => face.color_identity ?? []) ?? [];
    if (faceIdentity.length > 0) {
      return Array.from(new Set(faceIdentity));
    }
    if (card.colors && card.colors.length > 0) {
      return card.colors;
    }
    const faceColors = card.card_faces?.flatMap(face => face.colors ?? []) ?? [];
    return Array.from(new Set(faceColors));
  };

  const getCardFaces = (card: ScryfallCard) => {
    return (card.card_faces || [])
      .map(face => ({
        name: face.name,
        imageUrl: face.image_uris?.normal,
        smallImageUrl: face.image_uris?.small,
      }))
      .filter(face => !!face.imageUrl) as Array<{ name: string; imageUrl: string; smallImageUrl?: string }>;
  };

  const toggleSearchFace = (cardId: string) => {
    setSearchFaceOverrides(prev => {
      const current = prev[cardId] ?? 0;
      return { ...prev, [cardId]: current === 0 ? 1 : 0 };
    });
  };

  return (
    <div className="card-gallery">
      <div className="quick-search">
        <div className="quick-search-header">
          <h3>Quick add</h3>
          <button
            className={`foil-toggle-btn ${isFoilMode ? 'active' : ''}`}
            onClick={() => setIsFoilMode(!isFoilMode)}
            title={isFoilMode ? 'Adding as Foil' : 'Adding as Non-Foil'}
          >
            {isFoilMode ? '✨ Foil' : 'Regular'}
          </button>
        </div>
        <div className="quick-search-input">
          <input
            type="text"
            placeholder="Search card name..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search cards"
          />
        </div>
        {searchError && <div className="search-error">{searchError}</div>}
        {searchLoading && <div className="search-loading">Searching...</div>}
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map(result => {
              const faces = getCardFaces(result);
              const faceIndex = searchFaceOverrides[result.id] ?? 0;
              const faceImage = faces[faceIndex]?.smallImageUrl || scryfallAPI.getCardSmallImageUrl(result);
              return (
                <button
                  key={result.id}
                  className="search-result-card"
                  onClick={() => {
                    const cardFaces = getCardFaces(result);

                    // Get price based on foil mode
                    let priceEur: number | undefined;
                    if (result.prices) {
                      const priceString = isFoilMode ? result.prices.eur_foil : result.prices.eur;
                      if (priceString) {
                        priceEur = parseFloat(priceString);
                      }
                    }

                    const card: Card = {
                      id: Date.now() + Math.random(),
                      scryfallId: result.id,
                      name: result.name,
                      set: result.set,
                      setName: result.set_name || result.set.toUpperCase(),
                      setReleasedAt: result.released_at,
                      type: result.type_line,
                      colors: sortColors(getCardColors(result)),
                      quantity: 1,
                      imageUrl: scryfallAPI.getCardImageUrl(result),
                      cardFaces,
                      rarity: result.rarity,
                      collectorNumber: result.collector_number,
                      oracleText: result.oracle_text,
                      isFoil: isFoilMode,
                      priceEur,
                    };
                    onAddCard(card);
                  }}
                >
                  <img src={faceImage} alt={result.name} />
                  {faces.length > 1 && (
                    <button
                      type="button"
                      className="card-flip-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleSearchFace(result.id);
                      }}
                    >
                      Flip
                    </button>
                  )}
                  {getCardQuantity(result.id) > 0 && (
                    <div className="search-result-badge">
                      {getCardQuantity(result.id) >= 4
                        ? '✓'
                        : `${getCardQuantity(result.id)}/4`}
                    </div>
                  )}
                  <div className="search-result-info">
                    <div className="search-result-name">{result.name}</div>
                    <div className="search-result-set">
                      {result.set_name || result.set.toUpperCase()}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickAdd;

