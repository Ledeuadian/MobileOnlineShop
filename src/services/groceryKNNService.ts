import { supabase } from './supabaseService';

export interface PurchaseRecord {
  productTypeId: number;
  productName: string;
  storeId: number;
  storeName: string;
  price: number;
  purchaseDate: Date;
  quantity: number;
}

export interface CandidateProduct {
  productTypeId: number;
  name: string;
  brand?: string | null;
  variant?: string | null;
  unit?: string | null;
  storeId: number;
  storeName: string;
  price: number;
}

export interface ScoredCandidate extends CandidateProduct {
  score: number;
  averageDistance: number;
}

export interface FeatureVector {
  day: number;
  month: number;
  weekday: number;
  storeEncoded: number;
  price: number;
}

/**
 * GroceryKNNService
 *
 * TypeScript port of the Python KNN grocery recommendation algorithm.
 *
 * The model is trained on the shopper's historical purchases (one row per
 * purchase). Each purchase is represented as a normalized feature vector of:
 *   - day / month / weekday of purchase
 *   - encoded store id
 *   - price paid
 *
 * Given a "current shopper context" (today's date + preferred store + typical
 * price range), we find the k nearest historical purchases in Euclidean space
 * and recommend the products that appear most frequently among those neighbors.
 *
 * This mirrors the Python reference implementation without requiring pandas,
 * scikit-learn, or any Python runtime.
 */
export class GroceryKNNService {
  static readonly DEFAULT_K = 5;

  private storeNames: string[] = [];
  private storeNameToIndex = new Map<string, number>();

  private purchaseVectors: FeatureVector[] = [];
  private purchaseRecords: PurchaseRecord[] = [];

  private mean: FeatureVector = { day: 0, month: 0, weekday: 0, storeEncoded: 0, price: 0 };
  private std: FeatureVector = { day: 1, month: 1, weekday: 1, storeEncoded: 1, price: 1 };

  /**
   * Fit the model on purchase history. This mirrors pandas preprocessing +
   * LabelEncoder + StandardScaler + NearestNeighbors.fit() in the Python code.
   */
  fit(purchases: PurchaseRecord[]) {
    this.purchaseRecords = [...purchases];

    // Encode store names like LabelEncoder
    const uniqueStores = Array.from(new Set(purchases.map(p => p.storeName))).sort();
    this.storeNames = uniqueStores;
    this.storeNameToIndex = new Map(uniqueStores.map((name, i) => [name, i]));

    // Build raw feature vectors
    this.purchaseVectors = purchases.map(p => ({
      day: p.purchaseDate.getDate(),
      month: p.purchaseDate.getMonth() + 1,
      weekday: p.purchaseDate.getDay(),
      storeEncoded: this.encodeStore(p.storeName),
      price: p.price
    }));

    // Compute StandardScaler parameters (mean + std)
    this.mean = this.computeMean(this.purchaseVectors);
    this.std = this.computeStd(this.purchaseVectors, this.mean);

    // Scale all training vectors
    this.purchaseVectors = this.purchaseVectors.map(v => this.scale(v));
  }

  /**
   * Recommend products for the given shopper context.
   *
   * @param contextDate   The reference date (e.g. today).
   * @param storeName     The store the shopper is currently focused on.
   * @param price         Typical price point for the recommendation context.
   * @param k             Number of nearest neighbors to consider.
   * @param candidates    Products currently in stock that can be recommended.
   */
  recommend(
    contextDate: Date,
    storeName: string,
    price: number,
    candidates: CandidateProduct[],
    k: number = GroceryKNNService.DEFAULT_K
  ): ScoredCandidate[] {
    if (this.purchaseVectors.length === 0 || candidates.length === 0) {
      return candidates.map(c => ({ ...c, score: 0, averageDistance: Number.MAX_VALUE }));
    }

    const contextVector = this.scale({
      day: contextDate.getDate(),
      month: contextDate.getMonth() + 1,
      weekday: contextDate.getDay(),
      storeEncoded: this.encodeStore(storeName),
      price
    });

    // Find k nearest neighbors by Euclidean distance
    const distances = this.purchaseVectors.map((vector, index) => ({
      distance: this.euclideanDistance(vector, contextVector),
      index
    }));

    distances.sort((a, b) => a.distance - b.distance);
    const nearest = distances.slice(0, k);

    // Count how often each product appears among the nearest purchases
    const productTypeFrequency = new Map<number, number>();
    const productTypeTotalDistance = new Map<number, number>();

    nearest.forEach(({ index, distance }) => {
      const record = this.purchaseRecords[index];
      productTypeFrequency.set(
        record.productTypeId,
        (productTypeFrequency.get(record.productTypeId) || 0) + record.quantity
      );
      productTypeTotalDistance.set(
        record.productTypeId,
        (productTypeTotalDistance.get(record.productTypeId) || 0) + distance
      );
    });

    // Score each candidate: higher frequency and lower average distance wins.
    // Products that never appear among neighbors get score 0 and max distance.
    const scored = candidates.map(candidate => {
      const frequency = productTypeFrequency.get(candidate.productTypeId) || 0;
      const totalDistance = productTypeTotalDistance.get(candidate.productTypeId) || 0;
      const averageDistance = frequency > 0 ? totalDistance / frequency : Number.MAX_VALUE;

      // Score = frequency weighted by inverse average distance.
      // Adding 1 to distance avoids division by zero and dampens exact matches.
      const score = frequency > 0 ? frequency / (1 + averageDistance) : 0;

      return {
        ...candidate,
        score,
        averageDistance
      };
    });

    return scored
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.averageDistance !== b.averageDistance) return a.averageDistance - b.averageDistance;
        return a.name.localeCompare(b.name);
      })
      .slice(0, k);
  }

  /**
   * Convenience method: load a shopper's non-cancelled purchase history from
   * Supabase, joined with store and product type details.
   */
  static async fetchPurchaseHistory(shopperUserId: number): Promise<PurchaseRecord[]> {
    const { data: orders, error: ordersError } = await supabase
      .from('ORDERS')
      .select('orderId, createdAt, storeId, status')
      .eq('userId', shopperUserId)
      .neq('status', 'cancelled');

    if (ordersError || !orders || orders.length === 0) {
      if (ordersError) console.warn('Could not fetch shopper orders:', ordersError);
      return [];
    }

    const orderIds = orders.map(o => o.orderId);
    const orderIdToOrder = new Map(orders.map(o => [o.orderId, o]));

    const { data: orderItems, error: itemsError } = await supabase
      .from('ORDER_ITEMS')
      .select('orderId, storeItemId, quantity, price')
      .in('orderId', orderIds);

    if (itemsError || !orderItems) {
      if (itemsError) console.warn('Could not fetch order items:', itemsError);
      return [];
    }

    // Resolve storeItemId -> productTypeId and storeId
    const storeItemIds = Array.from(new Set(orderItems.map(oi => oi.storeItemId)));
    const { data: itemsInStore, error: storeItemsError } = await supabase
      .from('ITEMS_IN_STORE')
      .select('storeItemId, productTypeId, storeId, name, item_name, price')
      .in('storeItemId', storeItemIds);

    if (storeItemsError || !itemsInStore) {
      if (storeItemsError) console.warn('Could not fetch store items:', storeItemsError);
      return [];
    }

    const storeIds = Array.from(new Set(itemsInStore.map(i => i.storeId).filter(Boolean)));
    const { data: stores, error: storesError } = await supabase
      .from('GROCERY_STORE')
      .select('storeId, storeName')
      .in('storeId', storeIds);

    if (storesError || !stores) {
      if (storesError) console.warn('Could not fetch stores:', storesError);
      return [];
    }

    const productTypeIds = Array.from(
      new Set(itemsInStore.map(i => i.productTypeId).filter(pid => pid != null))
    );
    const { data: productTypes, error: productTypesError } = await supabase
      .from('PRODUCT_TYPE')
      .select('productTypeId, Name')
      .in('productTypeId', productTypeIds);

    if (productTypesError || !productTypes) {
      if (productTypesError) console.warn('Could not fetch product types:', productTypesError);
      return [];
    }

    const storeItemMap = new Map(itemsInStore.map(i => [i.storeItemId, i]));
    const storeMap = new Map(stores.map(s => [s.storeId, s]));
    const productTypeMap = new Map(productTypes.map(p => [p.productTypeId, p]));

    const records: PurchaseRecord[] = [];
    orderItems.forEach(oi => {
      const order = orderIdToOrder.get(oi.orderId);
      const storeItem = storeItemMap.get(oi.storeItemId);
      if (!order || !storeItem || storeItem.productTypeId == null) return;

      const store = storeMap.get(storeItem.storeId);
      const productType = productTypeMap.get(storeItem.productTypeId);
      if (!store || !productType) return;

      records.push({
        productTypeId: storeItem.productTypeId,
        productName: productType.Name,
        storeId: storeItem.storeId,
        storeName: store.storeName,
        price: oi.price ?? storeItem.price ?? 0,
        purchaseDate: order.createdAt ? new Date(order.createdAt) : new Date(),
        quantity: oi.quantity || 1
      });
    });

    return records;
  }

  private encodeStore(storeName: string): number {
    return this.storeNameToIndex.has(storeName) ? this.storeNameToIndex.get(storeName)! : -1;
  }

  private computeMean(vectors: FeatureVector[]): FeatureVector {
    if (vectors.length === 0) {
      return { day: 0, month: 0, weekday: 0, storeEncoded: 0, price: 0 };
    }
    const sum = vectors.reduce(
      (acc, v) => ({
        day: acc.day + v.day,
        month: acc.month + v.month,
        weekday: acc.weekday + v.weekday,
        storeEncoded: acc.storeEncoded + v.storeEncoded,
        price: acc.price + v.price
      }),
      { day: 0, month: 0, weekday: 0, storeEncoded: 0, price: 0 }
    );
    return {
      day: sum.day / vectors.length,
      month: sum.month / vectors.length,
      weekday: sum.weekday / vectors.length,
      storeEncoded: sum.storeEncoded / vectors.length,
      price: sum.price / vectors.length
    };
  }

  private computeStd(vectors: FeatureVector[], mean: FeatureVector): FeatureVector {
    if (vectors.length === 0) {
      return { day: 1, month: 1, weekday: 1, storeEncoded: 1, price: 1 };
    }
    const variance = vectors.reduce(
      (acc, v) => ({
        day: acc.day + Math.pow(v.day - mean.day, 2),
        month: acc.month + Math.pow(v.month - mean.month, 2),
        weekday: acc.weekday + Math.pow(v.weekday - mean.weekday, 2),
        storeEncoded: acc.storeEncoded + Math.pow(v.storeEncoded - mean.storeEncoded, 2),
        price: acc.price + Math.pow(v.price - mean.price, 2)
      }),
      { day: 0, month: 0, weekday: 0, storeEncoded: 0, price: 0 }
    );
    return {
      day: Math.sqrt(variance.day / vectors.length) || 1,
      month: Math.sqrt(variance.month / vectors.length) || 1,
      weekday: Math.sqrt(variance.weekday / vectors.length) || 1,
      storeEncoded: Math.sqrt(variance.storeEncoded / vectors.length) || 1,
      price: Math.sqrt(variance.price / vectors.length) || 1
    };
  }

  private scale(vector: FeatureVector): FeatureVector {
    return {
      day: (vector.day - this.mean.day) / this.std.day,
      month: (vector.month - this.mean.month) / this.std.month,
      weekday: (vector.weekday - this.mean.weekday) / this.std.weekday,
      storeEncoded: (vector.storeEncoded - this.mean.storeEncoded) / this.std.storeEncoded,
      price: (vector.price - this.mean.price) / this.std.price
    };
  }

  private euclideanDistance(a: FeatureVector, b: FeatureVector): number {
    return Math.sqrt(
      Math.pow(a.day - b.day, 2) +
      Math.pow(a.month - b.month, 2) +
      Math.pow(a.weekday - b.weekday, 2) +
      Math.pow(a.storeEncoded - b.storeEncoded, 2) +
      Math.pow(a.price - b.price, 2)
    );
  }
}
