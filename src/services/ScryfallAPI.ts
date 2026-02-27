import { rateLimiter } from './RateLimiter';

export interface ScryfallSet {
  id: string;
  code: string;
  name: string;
  set_type: string;
  digital?: boolean;
  released_at: string;
  icon_svg_uri: string;
  scryfall_uri: string;
}

export interface ScryfallCard {
  id: string;
  name: string;
  oracle_text?: string;
  set_name?: string;
  rarity?: string;
  image_uris?: {
    normal: string;
    small: string;
  };
  card_faces?: Array<{
    image_uris?: {
      normal: string;
      small: string;
    };
    name: string;
    colors?: string[];
    color_identity?: string[];
  }>;
  color_identity?: string[];
  type_line: string;
  colors: string[];
  set: string;
  collector_number: string;
  released_at: string;
  prices?: {
    eur?: string | null;
    eur_foil?: string | null;
  };
}

export interface ScryfallCardsResponse {
  object: string;
  total_cards: number;
  has_more: boolean;
  data: ScryfallCard[];
  next_page?: string;
}

class ScryfallAPI {
  private baseUrl = 'https://api.scryfall.com';

  private buildHeaders(): HeadersInit {
    return {
      Accept: 'application/json;q=0.9,*/*;q=0.8',
    };
  }

  async getSets(): Promise<ScryfallSet[]> {
    await rateLimiter.wait();
    const response = await fetch(`${this.baseUrl}/sets`, {
      headers: this.buildHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch sets: ${response.statusText}`);
    }
    const data = await response.json();
    // Filter to only include paper sets with released_at
    const excludedCodes = new Set(['tla', 'mar', 'spm', 'fca', 'fic', 'fin']);
    return data.data.filter((set: ScryfallSet) =>
      set.released_at && !set.digital && !excludedCodes.has(set.code.toLowerCase())
    );
  }

  async getCardsForSet(setCode: string, page: number = 1): Promise<ScryfallCardsResponse> {
    await rateLimiter.wait();
    const pageSize = 175; // Max allowed by Scryfall
    const response = await fetch(
      `${this.baseUrl}/cards/search?q=e:${setCode}&unique=prints&order=set&dir=asc&include_extras=true&include_variations=true&page=${page}&pagesize=${pageSize}`,
      { headers: this.buildHeaders() }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch cards for set ${setCode}: ${response.statusText}`);
    }
    return response.json();
  }

  async searchCards(query: string, page: number = 1, pageSize: number = 20): Promise<ScryfallCardsResponse> {
    await rateLimiter.wait();
    const response = await fetch(
      `${this.baseUrl}/cards/search?q=${encodeURIComponent(query)}&unique=prints&order=name&dir=asc&page=${page}&pagesize=${pageSize}`,
      { headers: this.buildHeaders() }
    );
    if (!response.ok) {
      throw new Error(`Failed to search cards: ${response.statusText}`);
    }
    return response.json();
  }

  getCardImageUrl(card: ScryfallCard): string {
    // Try normal image first
    if (card.image_uris?.normal) {
      return card.image_uris.normal;
    }
    // Fall back to card faces (for double-faced cards)
    if (card.card_faces?.[0]?.image_uris?.normal) {
      return card.card_faces[0].image_uris.normal;
    }
    // Return placeholder if no image
    return 'https://cards.scryfall.io/normal/front/0/0/00aec4fb-36e4-406b-85e5-398b2b7b9f7d.jpg';
  }

  getCardSmallImageUrl(card: ScryfallCard): string {
    if (card.image_uris?.small) {
      return card.image_uris.small;
    }
    if (card.card_faces?.[0]?.image_uris?.small) {
      return card.card_faces[0].image_uris.small;
    }
    return 'https://cards.scryfall.io/small/front/0/0/00aec4fb-36e4-406b-85e5-398b2b7b9f7d.jpg';
  }

  getManaColor(card: ScryfallCard): string {
    if (!card.colors || card.colors.length === 0) {
      return 'Colorless';
    }
    if (card.colors.length === 1) {
      const colorMap: Record<string, string> = {
        'W': 'White',
        'U': 'Blue',
        'B': 'Black',
        'R': 'Red',
        'G': 'Green',
      };
      return colorMap[card.colors[0]] || 'Colorless';
    }
    return 'Multi';
  }
}

export const scryfallAPI = new ScryfallAPI();

