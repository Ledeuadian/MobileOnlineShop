import React, { useState, useEffect } from 'react';
import './ProductSizeSelector.css';

// Product variant interface
export interface ProductVariant {
  productTypeId: number;
  name: string;
  brand: string;
  variant: string;
  unit: string;
  quantity: number;
  price?: number;
}

interface ProductSizeSelectorProps {
  variants: ProductVariant[];
  selectedVariant?: ProductVariant;
  onVariantSelect: (variant: ProductVariant) => void;
  showLabel?: boolean;
}

/**
 * ProductSizeSelector Component
 * 
 * Displays multiple size/measurement options for a product
 * (e.g., Salt: 150g, 300g, 1kg)
 * 
 * Each size is a different product entry with different productTypeId
 */
const ProductSizeSelector: React.FC<ProductSizeSelectorProps> = ({
  variants,
  selectedVariant,
  onVariantSelect,
  showLabel = true
}) => {
  const [selected, setSelected] = useState<ProductVariant | undefined>(selectedVariant);

  useEffect(() => {
    // If no variant is selected, default to the first one
    if (!selected && variants.length > 0) {
      setSelected(variants[0]);
      onVariantSelect(variants[0]);
    }
  }, [variants, selected, onVariantSelect]);

  const handleSelectVariant = (variant: ProductVariant) => {
    setSelected(variant);
    onVariantSelect(variant);
  };

  // If only one variant, don't show the selector
  if (variants.length <= 1) {
    return null;
  }

  return (
    <div className="product-size-selector">
      {showLabel && (
        <label className="size-selector-label">Measurement:</label>
      )}
      <div className="size-options">
        {variants
          .sort((a, b) => {
            // Sort by unit size (extract numbers from unit string)
            const aNum = parseFloat(a.unit.match(/\d+(\.\d+)?/)?.[0] || '0');
            const bNum = parseFloat(b.unit.match(/\d+(\.\d+)?/)?.[0] || '0');
            return aNum - bNum;
          })
          .map((variant) => (
            <button
              key={variant.productTypeId}
              className={`size-option ${
                selected?.productTypeId === variant.productTypeId ? 'selected' : ''
              }`}
              onClick={() => handleSelectVariant(variant)}
              type="button"
            >
              {/* Extract just the size/unit part (e.g., "150g", "1kg") */}
              {variant.unit.replace(/^(pack|bottle|can|box)\s*/i, '')}
            </button>
          ))}
      </div>
    </div>
  );
};

export default ProductSizeSelector;
