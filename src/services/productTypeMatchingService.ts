import { supabase } from './supabaseService';

interface ProductType {
  productTypeId: number;
  Name: string;
  Brand: string;
  Variant: string;
  Unit: string;
  Quantity: number;
  matchScore?: number; // For sorting suggestions
}

interface StoreItem {
  name: string;
  brand?: string;
  category: string;
  unit: string;
  description?: string;
}

/**
 * Service to automatically match store items with standardized PRODUCT_TYPE entries
 * This enables proper SRP price monitoring by the DTI
 */
export class ProductTypeMatchingService {
  
  /**
   * Find the best matching productTypeId for a store item
   * Uses Smart Matching on Name, Brand, Variant, Unit as requested
   * Returns productTypeId if match score >= 70% (recommended threshold)
   */
  static async findBestMatch(storeItem: StoreItem): Promise<number | null> {
    try {
      console.log('🔍 Finding product type match for:', {
        name: storeItem.name,
        brand: storeItem.brand,
        category: storeItem.category,
        unit: storeItem.unit
      });

      // Get all product types from database
      const { data: productTypes, error } = await supabase
        .from('PRODUCT_TYPE')
        .select('productTypeId, Name, Brand, Variant, Unit, Quantity');

      if (error || !productTypes) {
        console.error('Error fetching product types:', error);
        return null;
      }

      console.log(`📊 Comparing against ${productTypes.length} standard product types...`);

      let bestMatch: ProductType | null = null;
      let highestScore = 0;
      const MIN_MATCH_THRESHOLD = 0.7; // 70% similarity required for auto-matching

      for (const productType of productTypes) {
        console.log(`\n🔍 Checking: ${productType.Name} - ${productType.Brand}`);
        const score = this.calculateMatchScore(storeItem, productType);
        
        if (score > highestScore) {
          highestScore = score;
          bestMatch = productType;
        }
      }

      console.log('\n🎯 MATCHING RESULTS:');
      console.log(`Best Match: ${bestMatch?.Name} - ${bestMatch?.Brand}`);
      console.log(`Match Score: ${(highestScore * 100).toFixed(1)}%`);
      console.log(`Threshold: ${(MIN_MATCH_THRESHOLD * 100)}%`);
      console.log(`Auto-Link: ${highestScore >= MIN_MATCH_THRESHOLD ? '✅ YES' : '❌ NO'}`);

      if (highestScore >= MIN_MATCH_THRESHOLD && bestMatch) {
        console.log(`🔗 AUTO-LINKING: Item "${storeItem.name}" → Product Type ID ${bestMatch.productTypeId}`);
        return bestMatch.productTypeId;
      } else {
        console.log('⚠️ No suitable match found - item will be saved without productTypeId');
        return null;
      }
    } catch (error) {
      console.error('Error in product type matching:', error);
      return null;
    }
  }

  /**
   * Calculate similarity score between store item and product type
   * Focuses on Name, Brand, Variant (category), and Unit matching as requested
   * Returns score between 0-1 (1 being perfect match)
   */
  private static calculateMatchScore(storeItem: StoreItem, productType: ProductType): number {
    let totalScore = 0;
    let weightSum = 0;

    // 1. NAME SIMILARITY (Weight: 35% - Primary identifier)
    const nameWeight = 0.35;
    const nameScore = this.stringSimilarity(
      storeItem.name.toLowerCase(), 
      productType.Name.toLowerCase()
    );
    totalScore += nameScore * nameWeight;
    weightSum += nameWeight;
    console.log(`🏷️ Name match: "${storeItem.name}" vs "${productType.Name}" = ${nameScore.toFixed(2)}`);

    // 2. BRAND SIMILARITY (Weight: 25% - Critical for product identification)
    if (storeItem.brand && productType.Brand) {
      const brandWeight = 0.25;
      const brandScore = this.stringSimilarity(
        storeItem.brand.toLowerCase(),
        productType.Brand.toLowerCase()
      );
      totalScore += brandScore * brandWeight;
      weightSum += brandWeight;
      console.log(`🏭 Brand match: "${storeItem.brand}" vs "${productType.Brand}" = ${brandScore.toFixed(2)}`);
    } else if (!storeItem.brand || !productType.Brand) {
      // Partial credit if one is missing but allow matching
      const brandWeight = 0.1;
      totalScore += 0.5 * brandWeight; // Neutral score
      weightSum += brandWeight;
      console.log(`🏭 Brand partial: One brand missing, giving neutral score`);
    }

    // 3. UNIT EXACT MATCH (Weight: 25% - Must match for proper price comparison)
    if (storeItem.unit && productType.Unit) {
      const unitWeight = 0.25;
      const unitScore = this.normalizeUnit(storeItem.unit) === this.normalizeUnit(productType.Unit) ? 1 : 0;
      totalScore += unitScore * unitWeight;
      weightSum += unitWeight;
      console.log(`📦 Unit match: "${storeItem.unit}" vs "${productType.Unit}" = ${unitScore}`);
    }

    // 4. VARIANT/CATEGORY SIMILARITY (Weight: 15% - Additional context)
    if (storeItem.category && productType.Variant) {
      const variantWeight = 0.15;
      const variantScore = this.stringSimilarity(
        storeItem.category.toLowerCase(),
        productType.Variant.toLowerCase()
      );
      totalScore += variantScore * variantWeight;
      weightSum += variantWeight;
      console.log(`🏷️ Variant match: "${storeItem.category}" vs "${productType.Variant}" = ${variantScore.toFixed(2)}`);
    }

    const finalScore = weightSum > 0 ? totalScore / weightSum : 0;
    console.log(`🎯 Total score for ${productType.Name}: ${finalScore.toFixed(3)}`);
    
    return finalScore;
  }

  /**
   * Enhanced string similarity for product name matching
   * Uses multiple techniques: exact match, contains, word overlap, and Levenshtein
   */
  private static stringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1; // Perfect match
    if (str1.length === 0 || str2.length === 0) return 0;

    // Exact substring match (high score)
    if (str1.includes(str2) || str2.includes(str1)) {
      return 0.9;
    }

    // Word-based matching (check if key words overlap)
    const words1 = str1.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 2);
    const words2 = str2.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 2);
    
    if (words1.length > 0 && words2.length > 0) {
      const commonWords = words1.filter(w1 => 
        words2.some(w2 => w1 === w2 || w1.includes(w2) || w2.includes(w1))
      );
      const wordScore = commonWords.length / Math.max(words1.length, words2.length);
      
      if (wordScore > 0.5) {
        return Math.min(0.85, 0.4 + wordScore * 0.45); // Scale between 0.4-0.85
      }
    }

    // Levenshtein distance as fallback
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    const levenshteinScore = 1 - distance / maxLength;
    
    // Apply threshold - only return meaningful scores
    return levenshteinScore > 0.3 ? levenshteinScore : 0;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,    // deletion
          matrix[j - 1][i] + 1,    // insertion
          matrix[j - 1][i - 1] + indicator  // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Normalize unit strings for comparison
   */
  private static normalizeUnit(unit: string): string {
    const unitMap: Record<string, string> = {
      'kg': 'kilogram',
      'g': 'gram',
      'grams': 'gram',
      'pcs': 'piece',
      'pc': 'piece',
      'piece': 'piece',
      'liter': 'liter',
      'l': 'liter',
      'ml': 'milliliter',
      'milliliters': 'milliliter',
      'pack': 'pack',
      'bottle': 'bottle'
    };

    return unitMap[unit.toLowerCase()] || unit.toLowerCase();
  }

  /**
   * Get similar product suggestions for manual selection
   */
  static async getSimilarProducts(storeItem: StoreItem, limit: number = 5): Promise<ProductType[]> {
    try {
      const { data: productTypes, error } = await supabase
        .from('PRODUCT_TYPE')
        .select('productTypeId, Name, Brand, Variant, Unit, Quantity');

      if (error || !productTypes) {
        console.error('Error fetching product types:', error);
        return [];
      }

      // Score all products and return top matches
      const scoredProducts = productTypes.map(productType => ({
        ...productType,
        matchScore: this.calculateMatchScore(storeItem, productType)
      }));

      return scoredProducts
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting similar products:', error);
      return [];
    }
  }
}