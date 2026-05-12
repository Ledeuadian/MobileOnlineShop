import { supabase } from './supabaseService';
import { ProductVariant } from '../components/ProductSizeSelector';

export interface ProductGroup {
  name: string;
  brand: string;
  category?: string;
  variants: ProductVariant[];
}

export interface StoreProductWithVariants {
  storeItemId: number;
  name: string;
  brand: string;
  category: string;
  item_price: number;
  availability: number;
  productTypeId: number;
  variants: ProductVariant[];
}

/**
 * Service to handle products with multiple size/measurement options
 * 
 * For example, if "Salt" by "Mc Cormick" has 3 sizes (150g, 300g, 1kg),
 * this service will group them together so users can select their preferred size
 */
export class ProductVariantService {
  
  /**
   * Fetch all variants for a specific product (by name and brand)
   * Returns variants with pricing from ITEMS_IN_STORE
   */
  static async getProductVariants(
    name: string, 
    brand: string
  ): Promise<ProductVariant[]> {
    try {
      // Query ITEMS_IN_STORE for products with matching name and brand
      const { data, error } = await supabase
        .from('ITEMS_IN_STORE')
        .select('storeItemId, name, brand, unit, price, productTypeId, description, variant')
        .eq('name', name)
        .eq('brand', brand)
        .gt('availability', 0);

      if (error) {
        console.error('Error fetching product variants:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Deduplicate by unit (multiple stores may have same size)
      const uniqueVariants = new Map<string, ProductVariant>();
      
      data.forEach(item => {
        if (!uniqueVariants.has(item.unit)) {
          uniqueVariants.set(item.unit, {
            productTypeId: item.productTypeId,
            name: item.name,
            brand: item.brand,
            variant: item.variant || item.description,
            unit: item.unit,
            quantity: 1, // Default quantity for selection
            price: item.price
          });
        }
      });

      // Convert to array and sort by unit size
      const variants = Array.from(uniqueVariants.values());
      
      // Sort variants by extracting numeric value from unit
      variants.sort((a, b) => {
        const aNum = parseFloat(a.unit.match(/[\d.]+/)?.[0] || '0');
        const bNum = parseFloat(b.unit.match(/[\d.]+/)?.[0] || '0');
        return aNum - bNum;
      });

      return variants;
    } catch (error) {
      console.error('Error in getProductVariants:', error);
      return [];
    }
  }

  /**
   * Fetch all products grouped by name and brand
   * Returns only products that have multiple size options
   */
  static async getProductsWithMultipleSizes(): Promise<ProductGroup[]> {
    try {
      // First, get all products
      const { data, error } = await supabase
        .from('PRODUCT_TYPE')
        .select('productTypeId, Name, Brand, Variant, Unit, Quantity')
        .order('Name', { ascending: true });

      if (error || !data) {
        console.error('Error fetching products:', error);
        return [];
      }

      // Group by name and brand
      const grouped = new Map<string, ProductVariant[]>();
      
      data.forEach(item => {
        const key = `${item.Name}|${item.Brand}`;
        const variant: ProductVariant = {
          productTypeId: item.productTypeId,
          name: item.Name,
          brand: item.Brand,
          variant: item.Variant,
          unit: item.Unit,
          quantity: item.Quantity
        };

        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(variant);
      });

      // Convert to array and filter out single-variant products
      const productGroups: ProductGroup[] = [];
      
      grouped.forEach((variants, key) => {
        // Only include products with multiple sizes
        if (variants.length > 1) {
          const [name, brand] = key.split('|');
          productGroups.push({
            name,
            brand,
            variants
          });
        }
      });

      return productGroups;
    } catch (error) {
      console.error('Error in getProductsWithMultipleSizes:', error);
      return [];
    }
  }

  /**
   * Get products from a store, including their variants
   * Useful for showing size options in product listings
   */
  static async getStoreProductsWithVariants(storeId: number): Promise<StoreProductWithVariants[]> {
    try {
      // Get all items from this store
      const { data: storeItems, error: storeError } = await supabase
        .from('ITEMS_IN_STORE')
        .select('storeItemId, name, category, item_price, availability, productTypeId')
        .eq('storeId', storeId)
        .gt('availability', 0);

      if (storeError || !storeItems) {
        console.error('Error fetching store items:', storeError);
        return [];
      }

      // For each unique product (name), fetch all variants
      const productMap = new Map<string, StoreProductWithVariants>();
      
      for (const item of storeItems) {
        // Get product type details
        const { data: productType } = await supabase
          .from('PRODUCT_TYPE')
          .select('Name, Brand, Variant')
          .eq('productTypeId', item.productTypeId)
          .single();

        if (productType) {
          const key = `${productType.Name}|${productType.Brand}`;
          
          if (!productMap.has(key)) {
            // Fetch all variants for this product
            const variants = await this.getProductVariants(
              productType.Name,
              productType.Brand
            );

            productMap.set(key, {
              ...item,
              name: productType.Name,
              brand: productType.Brand,
              variants: variants
            });
          }
        }
      }

      return Array.from(productMap.values());
    } catch (error) {
      console.error('Error in getStoreProductsWithVariants:', error);
      return [];
    }
  }

  /**
   * Check if a product has multiple size options
   */
  static async hasMultipleSizes(name: string, brand: string): Promise<boolean> {
    const variants = await this.getProductVariants(name, brand);
    return variants.length > 1;
  }
}

export default ProductVariantService;
