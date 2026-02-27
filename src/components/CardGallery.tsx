import React, { useState, useEffect } from 'react';
import { ScryfallCard, ScryfallSet, scryfallAPI } from '../services/ScryfallAPI';
import Card from '../types/Card';
import '../styles/CardGallery.css';

const sortColors = (colors: string[]): string[] => {
  const colorOrder: Record<string, number> = { 'W': 0, 'U': 1, 'B': 2, 'R': 3, 'G': 4 };
  return [...colors].sort((a, b) => (colorOrder[a] ?? 99) - (colorOrder[b] ?? 99));
};

interface CardGalleryProps {
  set: ScryfallSet | null;
  onAddCard: (card: Card) => void;
  collectionCards: Card[];
}

const CardGallery: React.FC<CardGalleryProps> = ({ set, onAddCard, collectionCards }) => {
  const [cards, setCards] = useState<ScryfallCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCount, setLoadingCount] = useState(0);
  const [faceOverrides, setFaceOverrides] = useState<Record<string, number>>({});
  const [isFoilMode, setIsFoilMode] = useState(false);
  const [foilAnimated, setFoilAnimated] = useState(true);

  useEffect(() => {
    setCards([]);
    setError(null);
    setLoadingCount(0);
    setFaceOverrides({});
  }, [set]);

  useEffect(() => {
    if (!set) {
      return;
    }

    const sortByCollectorNumber = (items: ScryfallCard[]) => {
      return [...items].sort((a, b) => {
        const aNum = parseInt(a.collector_number, 10);
        const bNum = parseInt(b.collector_number, 10);

        if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
          return aNum - bNum;
        }
        if (!Number.isNaN(aNum)) {
          return -1;
        }
        if (!Number.isNaN(bNum)) {
          return 1;
        }
        return a.collector_number.localeCompare(b.collector_number, undefined, { numeric: true });
      });
    };

    const fetchAllPages = async () => {
      try {
        setLoading(true);
        setCards([]);
        setLoadingCount(0);

        let page = 1;
        let hasMore = true;
        let allCards: ScryfallCard[] = [];

        while (hasMore) {
          const response = await scryfallAPI.getCardsForSet(set.code.toLowerCase(), page);
          const sortedPage = sortByCollectorNumber(response.data);
          allCards = [...allCards, ...sortedPage];
          setCards(allCards);
          setLoadingCount(allCards.length);

          hasMore = response.has_more;
          page += 1;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cards');
      } finally {
        setLoading(false);
      }
    };

    fetchAllPages();
  }, [set]);

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

  const toggleFace = (cardId: string) => {
    setFaceOverrides(prev => {
      const current = prev[cardId] ?? 0;
      return { ...prev, [cardId]: current === 0 ? 1 : 0 };
    });
  };

  if (!set) {
    return (
      <div className="card-gallery">
        <div className="gallery-empty">
          <p>👈 Select a set to browse cards</p>
        </div>
      </div>
    );
  }

  const handleAddCard = (scryfallCard: ScryfallCard) => {
    const cardFaces = getCardFaces(scryfallCard);

    // Get price based on foil mode
    let priceEur: number | undefined;
    if (scryfallCard.prices) {
      const priceString = isFoilMode ? scryfallCard.prices.eur_foil : scryfallCard.prices.eur;
      if (priceString) {
        priceEur = parseFloat(priceString);
      }
    }

    const card: Card = {
      id: Date.now() + Math.random(),
      scryfallId: scryfallCard.id,
      name: scryfallCard.name,
      set: set.code,
      setName: set.name,
      setReleasedAt: set.released_at,
      type: scryfallCard.type_line,
      colors: sortColors(getCardColors(scryfallCard)),
      quantity: 1,
      imageUrl: scryfallAPI.getCardImageUrl(scryfallCard),
      cardFaces,
      rarity: scryfallCard.rarity,
      collectorNumber: scryfallCard.collector_number,
      oracleText: scryfallCard.oracle_text,
      isFoil: isFoilMode,
      priceEur,
    };
    onAddCard(card);
  };

  return (
    <div className="card-gallery">

      <div className="gallery-header">
        <div className="gallery-header-top">
          <div>
            <h3>{set.name}</h3>
            <p>{loading ? `Loading ${loadingCount} cards...` : `${cards.length} cards loaded`}</p>
          </div>
          <div className="foil-toggle-group">
            <button
              className={`foil-toggle-btn ${isFoilMode ? 'active' : ''}`}
              onClick={() => setIsFoilMode(!isFoilMode)}
              title={isFoilMode ? 'Adding as Foil' : 'Adding as Non-Foil'}
            >
              {isFoilMode ? '✨ Foil' : 'Regular'}
            </button>
            <button
              className={`foil-toggle-btn ${!foilAnimated ? 'active' : ''}`}
              onClick={() => setFoilAnimated(!foilAnimated)}
              title={foilAnimated ? 'Disable shimmer animation' : 'Enable shimmer animation'}
            >
              {foilAnimated ? 'Shimmer: Animated' : 'Shimmer: Static'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="gallery-error">Error: {error}</div>}

      <div className="gallery-grid">
        {cards.map(card => {
          const faces = getCardFaces(card);
          const faceIndex = faceOverrides[card.id] ?? 0;
          const faceImage = faces[faceIndex]?.smallImageUrl || scryfallAPI.getCardSmallImageUrl(card);
          const quantity = getCardQuantity(card.id);
          return (
            <div key={`${card.id}-${card.collector_number}`} className="gallery-card-wrapper">
              <div
                className={`gallery-card ${quantity > 0 ? 'in-collection' : ''} ${isFoilMode ? 'foil-mode' : ''} ${isFoilMode && !foilAnimated ? 'foil-static' : ''}`}
                onClick={() => handleAddCard(card)}
                title={`${card.name} - ${card.type_line}`}
              >
                <img
                  src={faceImage}
                  alt={card.name}
                  loading="lazy"
                  className={isFoilMode ? 'foil-effect' : ''}
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
                {quantity > 0 && (
                  <div className="in-collection-badge">
                    {quantity >= 4 ? '✓' : `${quantity}/4`}
                  </div>
                )}
              </div>
              <div className="card-name">{card.name}</div>
            </div>
          );
        })}
      </div>

      {loading && <div className="gallery-loading">Loading cards...</div>}

      {!loading && cards.length > 0 && (
        <div className="gallery-end">All cards loaded!</div>
      )}
    </div>
  );
};

export default CardGallery;
