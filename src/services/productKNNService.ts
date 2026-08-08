import { supabase } from './supabaseService';

export interface ProductProfile {
  productTypeId: number;
  name: string;
  brand?: string | null;
  variant?: string | null;
  unit?: string | null;
  category?: string | null;
}

export interface PurchaseSignal {
  productTypeId: number;
  count: number;
  lastBoughtAt: number;
}

export interface ScoredProduct extends ProductProfile {
  similarityScore: number;
  neighborDistance: number; // 0 = exact category match; higher = less related
}

/**
 * ProductKNNService
 *
 * KNN-style recommendation for grocery products based on a shopper's purchase
 * history. We build a "profile vector" of categories the shopper has bought from
 * (weighted by quantity and recency), then score every candidate product by how
 * close it is to that vector. Products in the same category as past purchases are
 * the nearest neighbors and bubble to the top.
 */
export class ProductKNNService {
  /**
   * Half-life in days for purchase recency weighting.
   * A purchase 30 days ago gets ~50% of the weight of a purchase today.
   */
  static readonly RECENCY_HALF_LIFE_DAYS = 30;

  /**
   * Default number of nearest neighbors to return.
   */
  static readonly DEFAULT_K = 50;

  /**
   * Build a weighted category profile from purchase signals.
   *
   * Each product type maps to a category (via itemsInStore). The profile is a
   * map of category -> weighted score, where score = sum(qty * recencyWeight).
   */
  static buildCategoryProfile(
    signals: Map<number, PurchaseSignal>,
    productTypeToCategory: Map<number, string>
  ): Map<string, number> {
    const now = Date.now();
    const halfLifeMs = this.RECENCY_HALF_LIFE_DAYS * 24 * 60 * 60 * 1000;
    const profile = new Map<string, number>();

    signals.forEach((signal, productTypeId) => {
      const category = productTypeToCategory.get(productTypeId);
      if (!category) return;

      const ageMs = Math.max(0, now - signal.lastBoughtAt);
      // Exponential decay: recency weight = 2^(-age / halfLife)
      const recencyWeight = halfLifeMs > 0
        ? Math.pow(2, -ageMs / halfLifeMs)
        : 1;
      const score = signal.count * recencyWeight;

      profile.set(category, (profile.get(category) || 0) + score);
    });

    return profile;
  }

  /**
   * Compute KNN similarity score for a candidate product.
   *
   * Score components:
   *  - Category match: if the product's category is in the profile, it gets the
   *    profile weight for that category (the "nearest neighbor" distance is 0).
   *  - Direct re-purchase bonus: if the shopper has already bought this exact
   *    product type, add a small bonus so favorites rank higher within the same
   *    category.
   *  - Otherwise, the product is unrelated (distance is max, score is 0).
   */
  static scoreProduct(
    product: ProductProfile,
    profile: Map<string, number>,
    signals: Map<number, PurchaseSignal>,
    now: number = Date.now()
  ): { score: number; distance: number } {
    const signal = signals.get(product.productTypeId);

    // Direct re-purchase: strongest signal
    if (signal) {
      const halfLifeMs = this.RECENCY_HALF_LIFE_DAYS * 24 * 60 * 60 * 1000;
      const ageMs = Math.max(0, now - signal.lastBoughtAt);
      const recencyWeight = halfLifeMs > 0
        ? Math.pow(2, -ageMs / halfLifeMs)
        : 1;
      return {
        score: signal.count * recencyWeight * 10, // multiply so repurchases beat similar-category items
        distance: 0
      };
    }

    // Category neighbor
    if (product.category && profile.has(product.category)) {
      const categoryScore = profile.get(product.category) || 0;
      return {
        score: categoryScore,
        distance: 1 // same category, different product
      };
    }

    // Unrelated product
    return { score: 0, distance: Number.MAX_VALUE };
  }

  /**
   * Find the K nearest product neighbors for a shopper.
   *
   * @param products         All candidate products (in stock, deduplicated).
   * @param signals          Shopper's purchase history signals.
   * @param productTypeToCategory  Map productTypeId -> category.
   * @param k                Maximum number of neighbors to return (default 50).
   */
  static findNearestProducts(
    products: ProductProfile[],
    signals: Map<number, PurchaseSignal>,
    productTypeToCategory: Map<number, string>,
    k: number = this.DEFAULT_K
  ): ScoredProduct[] {
    const profile = this.buildCategoryProfile(signals, productTypeToCategory);

    if (profile.size === 0) {
      return products.map(p => ({
        ...p,
        similarityScore: 0,
        neighborDistance: Number.MAX_VALUE
      }));
    }

    const now = Date.now();
    const scored = products.map(product => {
      const { score, distance } = this.scoreProduct(product, profile, signals, now);
      return {
        ...product,
        similarityScore: score,
        neighborDistance: distance
      };
    });

    return scored
      .sort((a, b) => {
        // Higher score first
        if (b.similarityScore !== a.similarityScore) {
          return b.similarityScore - a.similarityScore;
        }
        // Closer distance first
        if (a.neighborDistance !== b.neighborDistance) {
          return a.neighborDistance - b.neighborDistance;
        }
        // Alphabetical tie-breaker
        return a.name.localeCompare(b.name);
      })
      .slice(0, k);
  }

  /**
   * Convenience method: fetch ITEMS_IN_STORE categories and build the
   * productTypeId -> category map.
   */
  static async fetchProductTypeCategories(): Promise<Map<number, string>> {
    const { data, error } = await supabase
      .from('ITEMS_IN_STORE')
      .select('productTypeId, category, item_category')
      .not('productTypeId', 'is', null);

    if (error) {
      console.warn('Could not fetch product type categories:', error);
      return new Map();
    }

    const map = new Map<number, string>();
    (data || []).forEach(item => {
      const productTypeId = item.productTypeId as number | undefined;
      if (productTypeId == null) return;
      const category = (item.item_category || item.category || 'Other') as string;
      if (!map.has(productTypeId)) {
        map.set(productTypeId, category);
      }
    });

    return map;
  }
}
