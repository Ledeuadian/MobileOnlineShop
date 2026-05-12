# Product Size Selection Feature

This feature allows customers to select different sizes/measurements for the same product (e.g., Salt: 150g, 300g, 1kg). Each size is stored as a separate product with a unique `productTypeId`.

## Database Structure

Products with multiple sizes are stored as separate entries in the `PRODUCT_TYPE` table:

```sql
-- Example: Salt with 3 sizes
INSERT INTO "PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Salt', 'Mc Cormick', 'Iodized Salt', 'pack 150g', 1),  -- productTypeId: 101
('Salt', 'Mc Cormick', 'Iodized Salt', 'pack 300g', 1),  -- productTypeId: 102
('Salt', 'Mc Cormick', 'Iodized Salt', 'pack 1kg', 1);   -- productTypeId: 103
```

Each size has a **different `productTypeId`**, which allows for:
- **Different pricing** per size in `ITEMS_IN_STORE`
- **Independent inventory tracking**
- **Separate SRP monitoring** by DTI

## Components

### 1. ProductSizeSelector Component

Located at: `src/components/ProductSizeSelector.tsx`

```tsx
import ProductSizeSelector, { ProductVariant } from '../components/ProductSizeSelector';

// Example usage
const variants: ProductVariant[] = [
  { productTypeId: 101, name: 'Salt', brand: 'Mc Cormick', variant: 'Iodized Salt', unit: 'pack 150g', quantity: 1 },
  { productTypeId: 102, name: 'Salt', brand: 'Mc Cormick', variant: 'Iodized Salt', unit: 'pack 300g', quantity: 1 },
  { productTypeId: 103, name: 'Salt', brand: 'Mc Cormick', variant: 'Iodized Salt', unit: 'pack 1kg', quantity: 1 }
];

<ProductSizeSelector
  variants={variants}
  selectedVariant={variants[0]}
  onVariantSelect={(variant) => {
    console.log('Selected:', variant.productTypeId, variant.unit);
    // Update product selection
  }}
  showLabel={true}
/>
```

### 2. ProductVariantService

Located at: `src/services/productVariantService.ts`

Service for fetching and managing product variants:

```tsx
import ProductVariantService from '../services/productVariantService';

// Get all size options for a specific product
const variants = await ProductVariantService.getProductVariants('Salt', 'Mc Cormick');

// Get only products that have multiple sizes
const productsWithSizes = await ProductVariantService.getProductsWithMultipleSizes();

// Check if a product has multiple sizes
const hasMultiple = await ProductVariantService.hasMultipleSizes('Salt', 'Mc Cormick');
```

## Integration Examples

### Example 1: Grocery List with Size Selection

```tsx
import React, { useState, useEffect } from 'react';
import ProductSizeSelector, { ProductVariant } from '../components/ProductSizeSelector';
import ProductVariantService from '../services/productVariantService';

const GroceryListItem: React.FC = () => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>();

  useEffect(() => {
    // Load all variants for this product
    const loadVariants = async () => {
      const data = await ProductVariantService.getProductVariants('Salt', 'Mc Cormick');
      setVariants(data);
    };
    loadVariants();
  }, []);

  const handleAddToList = () => {
    // Add the selected variant (with its specific productTypeId) to the grocery list
    console.log('Adding to list:', selectedVariant?.productTypeId);
  };

  return (
    <div className="grocery-item">
      <h3>Mc Cormick Iodized Salt</h3>
      
      {/* Show size options */}
      <ProductSizeSelector
        variants={variants}
        onVariantSelect={setSelectedVariant}
      />

      <button onClick={handleAddToList}>Add to List</button>
    </div>
  );
};
```

### Example 2: Product Modal with Size Selection

```tsx
import React, { useState, useEffect } from 'react';
import { IonModal, IonButton } from '@ionic/react';
import ProductSizeSelector, { ProductVariant } from '../components/ProductSizeSelector';
import ProductVariantService from '../services/productVariantService';

interface ProductModalProps {
  productName: string;
  productBrand: string;
  isOpen: boolean;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ 
  productName, 
  productBrand, 
  isOpen, 
  onClose 
}) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      loadVariants();
    }
  }, [isOpen, productName, productBrand]);

  const loadVariants = async () => {
    const data = await ProductVariantService.getProductVariants(productName, productBrand);
    setVariants(data);
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;

    // Add to cart using the specific productTypeId
    console.log('Adding to cart:', {
      productTypeId: selectedVariant.productTypeId,
      quantity,
      unit: selectedVariant.unit
    });

    // Your add to cart logic here...
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <div className="product-modal">
        <h2>{productName}</h2>
        <p>Brand: {productBrand}</p>

        {/* Size Selector */}
        <ProductSizeSelector
          variants={variants}
          onVariantSelect={setSelectedVariant}
          showLabel={true}
        />

        {/* Quantity Selector */}
        <div className="quantity-selector">
          <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
          <span>{quantity}</span>
          <button onClick={() => setQuantity(q => q + 1)}>+</button>
        </div>

        {/* Price Display (if available) */}
        {selectedVariant?.price && (
          <div className="price">
            ₱{(selectedVariant.price * quantity).toFixed(2)}
          </div>
        )}

        <IonButton onClick={handleAddToCart}>Add to Cart</IonButton>
      </div>
    </IonModal>
  );
};
```

### Example 3: Store Dashboard - Adding Items with Multiple Sizes

When stores add inventory, they select the specific size variant:

```tsx
import React, { useState, useEffect } from 'react';
import { IonSelect, IonSelectOption } from '@ionic/react';
import ProductVariantService from '../services/productVariantService';

const AddStoreItem: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductType, setSelectedProductType] = useState<number>();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    // Get products grouped by name/brand with their variants
    const grouped = await ProductVariantService.getProductsWithMultipleSizes();
    setProducts(grouped);
  };

  return (
    <div>
      <IonSelect
        value={selectedProductType}
        onIonChange={e => setSelectedProductType(e.detail.value)}
        placeholder="Select product and size"
      >
        {products.map(group => (
          <React.Fragment key={`${group.name}-${group.brand}`}>
            <IonSelectOption disabled>
              {group.name} - {group.brand}
            </IonSelectOption>
            {group.variants.map(variant => (
              <IonSelectOption 
                key={variant.productTypeId} 
                value={variant.productTypeId}
              >
                &nbsp;&nbsp;{variant.unit}
              </IonSelectOption>
            ))}
          </React.Fragment>
        ))}
      </IonSelect>
    </div>
  );
};
```

## Database Setup

1. Run the SQL script to populate Philippine products:
```bash
psql -h your-host -U your-user -d your-database < database/populate_philippine_products.sql
```

Or in Supabase SQL Editor, paste and run: `database/populate_philippine_products.sql`

## Key Points

✅ **Each size = unique productTypeId** - Enables independent pricing and inventory  
✅ **Grouped by Name + Brand** - Users see all size options for the same product  
✅ **Automatic sorting** - Sizes are displayed from smallest to largest  
✅ **Flexible pricing** - Different sizes can have different prices per store  
✅ **SRP compliance** - DTI can monitor prices for specific sizes  

## Categories Added

The SQL script adds products for these categories:
- 🧂 **Condiments** (Soy sauce, Vinegar, Fish sauce, Salt, etc.)
- 🍎 **Produce** (Fruits & Vegetables)
- 🌾 **Cereal** (Rice, Oats, Bread, Corn Flakes, etc.)
- 🥤 **Beverages** (Soft drinks, Water, Coffee, Juice, etc.)
- 🥫 **Canned Goods** (Corned beef, Sardines, Tuna, etc.)
- 🍿 **Snacks** (Chips, Biscuits, Cookies, Chocolate, etc.)

All with multiple size options where applicable!
