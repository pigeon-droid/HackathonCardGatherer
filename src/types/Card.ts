interface Card {
  id: number;
  scryfallId: string;
  name: string;
  set: string;
  setName: string;
  setReleasedAt?: string;
  type: string;
  colors: string[]; // Array of color codes: W, U, B, R, G, or empty for colorless
  quantity: number;
  imageUrl: string;
  cardFaces?: Array<{
    name: string;
    imageUrl: string;
    smallImageUrl?: string;
  }>;
  rarity?: string;
  collectorNumber: string;
  oracleText?: string;
  isFoil?: boolean;
  priceEur?: number;
}

export default Card;
