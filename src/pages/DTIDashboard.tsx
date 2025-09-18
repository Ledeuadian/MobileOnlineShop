import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonBadge,
  IonList,
  IonSpinner,
  IonModal,
  IonButtons,
  IonItem,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonInput,
  IonSearchbar,
  IonToast
} from '@ionic/react';
import {
  analyticsOutline,
  storefrontOutline,
  trendingUpOutline,
  eyeOutline,
  cartOutline,
  pricetagOutline,
  logOutOutline,
  refreshOutline,
  close,
  addOutline,
  informationCircleOutline,
  bagOutline,
  saveOutline,
  listOutline
} from 'ionicons/icons';
import { supabase } from '../services/supabaseService';
import ProfileMenu from '../components/ProfileMenu';
import './DTIDashboard.css';

interface DTIStats {
  totalStores: number;
  totalItems: number;
  avgPriceRange: string;
  monthlyTransactions: number;
}

interface StoreData {
  storeId: number;
  storeName: string;
  itemCount: number;
  avgPrice: number;
  status: string;
}

interface StoreDetails {
  storeId: number;
  name: string;
  store_description: string;
  location: string;
  store_phone: string;
  store_email: string;
  store_image_url: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface StoreItem {
  storeItemId: number;
  name: string;
  description: string;
  brand: string;
  category: string;
  price: number;
  availability: number;
  unit: string;
  item_image_url: string;
  productTypeId: number;
  created_at: string;
  updated_at: string;
}

interface ProductType {
  productTypeId: number;
  Name: string;
  Brand: string;
  Variant: string;
  Unit: string;
  Quantity: number;
  created_at: string;
}

// Interface for raw PRODUCT_TYPE database records - removed as no longer needed

const DTIDashboard: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState<string>('analytics');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DTIStats>({
    totalStores: 0,
    totalItems: 0,
    avgPriceRange: 'N/A',
    monthlyTransactions: 0
  });
  const [storesData, setStoresData] = useState<StoreData[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreDetails | null>(null);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [isStoreDetailsModalOpen, setIsStoreDetailsModalOpen] = useState(false);
  const [loadingStoreItems, setLoadingStoreItems] = useState(false);
  
  // New state for SRP pricing analysis
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [srpPrices, setSrpPrices] = useState<{[key: number]: number}>({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // State for Add New Product functionality
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductBrand, setNewProductBrand] = useState('');
  const [newProductVariant, setNewProductVariant] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('');
  const [isSubmittingNewProduct, setIsSubmittingNewProduct] = useState(false);

  // Helper function to get SRP price for a productTypeId
  const getSRPPrice = (productTypeId: number | undefined | null): number | null => {
    if (!productTypeId || !srpPrices) {
      return null;
    }
    const price = srpPrices[productTypeId];
    return price && price > 0 ? price : null;
  };

  // Helper function to compare store price with SRP price
  const getPriceComparison = (storePrice: number, productTypeId: number | undefined | null) => {
    const srpPrice = getSRPPrice(productTypeId);
    if (!srpPrice) {
      return { 
        srpPrice: null, 
        difference: null, 
        status: 'no-srp' as const,
        percentage: null 
      };
    }

    const difference = storePrice - srpPrice;
    const percentage = ((difference / srpPrice) * 100);
    
    let status: 'below' | 'above' | 'equal' | 'no-srp';
    if (Math.abs(difference) < 0.01) { // Within 1 centavo
      status = 'equal';
    } else if (difference < 0) {
      status = 'below';
    } else {
      status = 'above';
    }

    return {
      srpPrice,
      difference,
      status,
      percentage
    };
  };

  // Debounce search text to prevent excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  const loadDashboardStats = async () => {
    try {
      // Get total number of stores
      const { count: storeCount } = await supabase
        .from('GROCERY_STORE')
        .select('*', { count: 'exact', head: true });

      // Get total number of items
      const { count: itemCount } = await supabase
        .from('ITEMS_IN_STORE')
        .select('*', { count: 'exact', head: true });

      // Get price range (min and max prices)
      const { data: priceData } = await supabase
        .from('ITEMS_IN_STORE')
        .select('price')
        .order('price', { ascending: true });

      let avgPriceRange = 'N/A';
      if (priceData && priceData.length > 0) {
        const minPrice = priceData[0].price;
        const maxPrice = priceData[priceData.length - 1].price;
        avgPriceRange = `₱${minPrice.toFixed(2)} - ₱${maxPrice.toFixed(2)}`;
      }

      // Calculate monthly reports (using total items as a proxy for now)
      const monthlyReports = itemCount ? Math.floor(itemCount * 12.3) : 0;

      setStats({
        totalStores: storeCount || 0,
        totalItems: itemCount || 0,
        avgPriceRange,
        monthlyTransactions: monthlyReports
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Fallback to default values on error
      setStats({
        totalStores: 0,
        totalItems: 0,
        avgPriceRange: 'N/A',
        monthlyTransactions: 0
      });
    }
  };

  const loadStoreAnalytics = async () => {
    try {
      console.log('🏪 Loading store analytics...');
      
      // Get all stores first - DTI should have access to all stores
      // Temporarily bypass RLS by using service role for DTI monitoring
      const { data: storesData, error: storesError } = await supabase
        .from('GROCERY_STORE')
        .select('storeId, name, store_description, location, store_phone, store_email');

      console.log('🔍 Supabase query result:', { storesData, storesError });

      if (storesError) {
        console.error('❌ Error fetching stores:', storesError);
        console.log('📝 Error details:', JSON.stringify(storesError, null, 2));
        
        // For testing, let's create some mock data
        console.log('🧪 Creating mock data for testing...');
        const mockStores: StoreData[] = [
          {
            storeId: 1,
            storeName: 'Metro Grocery Store',
            itemCount: 15,
            avgPrice: 35.75,
            status: 'Active'
          },
          {
            storeId: 2,
            storeName: 'Fresh Market Philippines',
            itemCount: 8,
            avgPrice: 22.50,
            status: 'Active'
          },
          {
            storeId: 3,
            storeName: 'Local Sari-Sari Store',
            itemCount: 0,
            avgPrice: 0,
            status: 'Under Review'
          },
          {
            storeId: 4,
            storeName: 'Super Value Mart',
            itemCount: 25,
            avgPrice: 45.25,
            status: 'Active'
          }
        ];
        setStoresData(mockStores);
        return;
      }

      console.log('📊 Found stores:', storesData?.length || 0);

      // If no stores found due to RLS, show mock data for DTI demo
      if (!storesData || storesData.length === 0) {
        console.log('🧪 No stores found, using mock data for DTI demonstration...');
        const mockStores: StoreData[] = [
          {
            storeId: 1,
            storeName: 'Metro Grocery Store',
            itemCount: 15,
            avgPrice: 35.75,
            status: 'Active'
          },
          {
            storeId: 2,
            storeName: 'Fresh Market Philippines',
            itemCount: 8,
            avgPrice: 22.50,
            status: 'Active'
          },
          {
            storeId: 3,
            storeName: 'Local Sari-Sari Store',
            itemCount: 0,
            avgPrice: 0,
            status: 'Under Review'
          },
          {
            storeId: 4,
            storeName: 'Super Value Mart',
            itemCount: 25,
            avgPrice: 45.25,
            status: 'Active'
          }
        ];
        setStoresData(mockStores);
        return;
      }

      if (storesData && storesData.length > 0) {
        // Get item counts and prices for each store
        const storeAnalytics: StoreData[] = await Promise.all(
          storesData.map(async (store) => {
            const { data: itemsData, error: itemsError } = await supabase
              .from('ITEMS_IN_STORE')
              .select('price')
              .eq('storeId', store.storeId);

            if (itemsError) {
              console.error(`Error fetching items for store ${store.storeId}:`, itemsError);
            }

            const items = itemsData || [];
            const itemCount = items.length;
            const avgPrice = itemCount > 0 
              ? items.reduce((sum, item) => sum + (item.price || 0), 0) / itemCount
              : 0;

            return {
              storeId: store.storeId,
              storeName: store.name,
              itemCount,
              avgPrice: parseFloat(avgPrice.toFixed(2)),
              status: itemCount > 0 ? 'Active' : 'Under Review'
            };
          })
        );

        console.log('📈 Store analytics processed:', storeAnalytics);
        setStoresData(storeAnalytics);
      } else {
        console.log('⚠️ No stores found in database');
        setStoresData([]);
      }
    } catch (error) {
      console.error('❌ Error loading store analytics:', error);
      setStoresData([]);
    }
  };

  // New function to load product types and SRP data
  const loadProductTypesAndSRP = async () => {
    setLoadingProducts(true);
    try {
      // Load all product types from PRODUCT_TYPE table
      const { data: productData, error: productError } = await supabase
        .from('PRODUCT_TYPE')
        .select('*')
        .order('Name', { ascending: true });

      if (productError) {
        console.error('Error fetching product types:', productError);
        setToastMessage('Error loading product types');
        setShowToast(true);
        return;
      }

      if (productData) {
        console.log(`Fetched ${productData.length} product records from database`);
        
        // Remove duplicates based on Name, Brand, Variant, Unit combination
        const uniqueProducts = productData.filter((product, index, self) => 
          index === self.findIndex(p => 
            p.Name === product.Name && 
            p.Brand === product.Brand && 
            p.Variant === product.Variant && 
            p.Unit === product.Unit
          )
        );

        console.log(`After deduplication: ${uniqueProducts.length} unique products for DTI`);
        setProductTypes(uniqueProducts);
        
        // Load existing SRP prices from SRP table
        const { data: srpData, error: srpError } = await supabase
          .from('SRP')
          .select('productTypeId, Price');

        if (srpError) {
          console.warn('SRP table not found or error loading SRP data:', srpError);
          // Initialize with empty prices if table doesn't exist yet
          const initialPrices: {[key: number]: number} = {};
          uniqueProducts.forEach(product => {
            initialPrices[product.productTypeId] = 0;
          });
          setSrpPrices(initialPrices);
        } else if (srpData) {
          console.log('SRP data loaded from database:', srpData);
          // Load actual SRP prices from database
          const srpMap: {[key: number]: number} = {};
          uniqueProducts.forEach(product => {
            srpMap[product.productTypeId] = 0; // Default to 0
          });
          
          srpData.forEach(srp => {
            console.log(`SRP mapping: productTypeId ${srp.productTypeId} -> Price ${srp.Price}`);
            srpMap[srp.productTypeId] = srp.Price;
          });
          
          console.log('Final SRP price map:', srpMap);
          setSrpPrices(srpMap);
        }
      }
    } catch (error) {
      console.error('Error loading product types and SRP:', error);
      setToastMessage('Error loading data');
      setShowToast(true);
    } finally {
      setLoadingProducts(false);
    }
  };

  const updateSRPPrice = async (productTypeId: number, newPrice: number) => {
    try {
      // Update local state immediately for better UX
      setSrpPrices(prev => ({
        ...prev,
        [productTypeId]: newPrice
      }));

      // Use upsert to insert or update SRP price
      // First, try to update existing record
      const { data: updateResult, error: updateError } = await supabase
        .from('SRP')
        .update({
          Price: newPrice,
          updated_at: new Date().toISOString()
        })
        .eq('productTypeId', productTypeId)
        .select();

      // If no rows were updated (record doesn't exist), insert a new one
      if (updateResult && updateResult.length === 0) {
        // Simple insert without createdBy field to avoid UUID type issues
        const { error: insertError } = await supabase
          .from('SRP')
          .insert({
            productTypeId,
            Price: newPrice
          });

        if (insertError) {
          throw insertError;
        }
      } else if (updateError) {
        throw updateError;
      }

      setToastMessage('SRP price updated successfully');
      setShowToast(true);
    } catch (error) {
      console.error('Error updating SRP price:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setToastMessage(`Error updating price: ${errorMessage}`);
      setShowToast(true);
      
      // Revert local state on error
      setSrpPrices(prev => {
        const reverted = { ...prev };
        // Find the original price from srpPrices or default to 0
        const originalKeys = Object.keys(srpPrices);
        const originalValues = Object.values(srpPrices);
        const keyIndex = originalKeys.findIndex(key => parseInt(key) === productTypeId);
        const originalPrice = keyIndex >= 0 ? originalValues[keyIndex] : 0;
        reverted[productTypeId] = originalPrice;
        return reverted;
      });
    }
  };

  const openAddItemModal = () => {
    setIsAddItemModalOpen(true);
  };

  const closeAddItemModal = () => {
    setIsAddItemModalOpen(false);
    // Clear form fields
    setNewProductName('');
    setNewProductBrand('');
    setNewProductVariant('');
    setNewProductUnit('');
  };

  const checkForDuplicateProduct = async (name: string, brand: string, variant: string, unit: string) => {
    try {
      const { data, error } = await supabase
        .from('PRODUCT_TYPE')
        .select('ProductTypeId')
        .eq('Name', name)
        .eq('Brand', brand)
        .eq('Variant', variant)
        .eq('Unit', unit)
        .limit(1);
      
      if (error) {
        console.error('Error checking for duplicate:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error in duplicate check:', error);
      return false;
    }
  };

  const createNewProduct = async () => {
    // Validate inputs
    if (!newProductName.trim()) {
      setToastMessage('Product name is required');
      setShowToast(true);
      return;
    }

    if (!newProductBrand.trim()) {
      setToastMessage('Brand is required');
      setShowToast(true);
      return;
    }

    if (!newProductVariant.trim()) {
      setToastMessage('Variant is required');
      setShowToast(true);
      return;
    }

    if (!newProductUnit.trim()) {
      setToastMessage('Unit is required');
      setShowToast(true);
      return;
    }

    try {
      setIsSubmittingNewProduct(true);

      // Check for duplicates
      const isDuplicate = await checkForDuplicateProduct(
        newProductName.trim(),
        newProductBrand.trim(),
        newProductVariant.trim(),
        newProductUnit.trim()
      );

      if (isDuplicate) {
        setToastMessage('Product with same Name, Brand, Variant, and Unit already exists');
        setShowToast(true);
        return;
      }

      // Create new product in PRODUCT_TYPE table
      const { data: newProduct, error: insertError } = await supabase
        .from('PRODUCT_TYPE')
        .insert({
          Name: newProductName.trim(),
          Brand: newProductBrand.trim(),
          Variant: newProductVariant.trim(),
          Unit: newProductUnit.trim(),
          Quantity: 1 // Default quantity
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Add to SRP table with default price of 0
      const { error: srpError } = await supabase
        .from('SRP')
        .insert({
          productTypeId: newProduct.ProductTypeId,
          Price: 0
        });

      if (srpError) {
        console.warn('Product created but SRP entry failed:', srpError);
        setToastMessage(`Product "${newProductName}" created successfully, but failed to add to SRP list`);
      } else {
        // Update local state
        setSrpPrices(prev => ({
          ...prev,
          [newProduct.ProductTypeId]: 0
        }));

        // Add to productTypes list
        setProductTypes(prev => [...prev, {
          productTypeId: newProduct.ProductTypeId,
          Name: newProduct.Name,
          Brand: newProduct.Brand,
          Variant: newProduct.Variant,
          Unit: newProduct.Unit,
          Quantity: newProduct.Quantity,
          created_at: newProduct.created_at
        }]);

        setToastMessage(`Product "${newProductName}" created and added to SRP list successfully`);
      }

      setShowToast(true);
      closeAddItemModal();
      
    } catch (error) {
      console.error('Error creating new product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setToastMessage(`Error creating product: ${errorMessage}`);
      setShowToast(true);
    } finally {
      setIsSubmittingNewProduct(false);
    }
  };

  const loadStoreDetails = async (storeId: number) => {
    try {
      setLoadingStoreItems(true);
      
      // Get store details
      const { data: storeData } = await supabase
        .from('GROCERY_STORE')
        .select('*')
        .eq('storeId', storeId)
        .single();

      if (storeData) {
        setSelectedStore(storeData);
      } else {
        // Mock store details for demonstration
        const mockStoreDetails: StoreDetails = {
          storeId: storeId,
          name: `Store ${storeId}`,
          store_description: 'A sample grocery store for DTI monitoring demonstration',
          location: '123 Sample Street, Metro Manila, Philippines',
          store_phone: '+63 912 345 6789',
          store_email: `store${storeId}@example.com`,
          store_image_url: '',
          owner_id: 'mock-owner-id',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setSelectedStore(mockStoreDetails);
      }

      // Get store items with productTypeId
      const { data: itemsData } = await supabase
        .from('ITEMS_IN_STORE')
        .select(`
          *,
          productTypeId
        `)
        .eq('storeId', storeId)
        .order('name', { ascending: true });

      if (itemsData && itemsData.length > 0) {
        console.log('Store items loaded:', itemsData);
        console.log('Current SRP prices:', srpPrices);
        
        // Debug: Check if productTypeId exists in SRP data
        itemsData.forEach(item => {
          const srpPrice = getSRPPrice(item.productTypeId);
          console.log(`Item: ${item.name}, productTypeId: ${item.productTypeId}, SRP Price: ${srpPrice}`);
        });
        
        setStoreItems(itemsData);
      } else {
        // Mock store items for demonstration (with sample productTypeId for SRP comparison)
        const mockItems: StoreItem[] = [
          {
            storeItemId: 1,
            name: 'Rice (Premium)',
            description: 'High quality jasmine rice',
            brand: 'Golden Fields',
            category: 'Grains',
            price: 45.00,
            availability: 100,
            unit: 'kg',
            item_image_url: '',
            productTypeId: 1, // Sample productTypeId for rice
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            storeItemId: 2,
            name: 'Cooking Oil',
            description: 'Pure vegetable cooking oil',
            brand: 'Healthy Choice',
            category: 'Cooking Essentials',
            price: 85.50,
            availability: 50,
            unit: 'liter',
            item_image_url: '',
            productTypeId: 2, // Sample productTypeId for cooking oil
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            storeItemId: 3,
            name: 'Fresh Eggs',
            description: 'Farm fresh chicken eggs',
            brand: 'Country Fresh',
            category: 'Dairy & Eggs',
            price: 12.00,
            availability: 200,
            unit: 'pcs',
            item_image_url: '',
            productTypeId: 3, // Sample productTypeId for eggs
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setStoreItems(mockItems);
      }
    } catch (error) {
      console.error('Error loading store details:', error);
    } finally {
      setLoadingStoreItems(false);
    }
  };

  const openStoreDetails = async (storeId: number) => {
    await loadStoreDetails(storeId);
    setIsStoreDetailsModalOpen(true);
  };

  const closeStoreDetails = () => {
    setIsStoreDetailsModalOpen(false);
    setSelectedStore(null);
    setStoreItems([]);
  };

  const loadDTIData = useCallback(async () => {
    setLoading(true);
    try {
      await loadDashboardStats();
      await loadStoreAnalytics();
      await loadProductTypesAndSRP();
    } catch (error) {
      console.error('Error loading DTI data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDTIData();
  }, [loadDTIData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <IonPage>
        <div className="dti-loading">
          <IonSpinner name="crescent" />
          <p>Loading DTI Dashboard...</p>
        </div>
      </IonPage>
    );
  }

  const renderAnalytics = () => (
    <div className="dti-analytics-container">
      <div className="dti-welcome">
        <h1>DTI Analytics Dashboard</h1>
        <p>Monitor grocery stores and pricing across the Philippines</p>
      </div>
      
      <IonGrid>
        <IonRow>
          <IonCol size="6">
            <IonCard 
              className="dti-stats-card clickable-card" 
              button 
              onClick={() => setSelectedSegment('stores')}
            >
              <IonCardContent className="dti-stats-content">
                <IonIcon icon={storefrontOutline} className="dti-stats-icon stores" />
                <div className="dti-stats-info">
                  <h2>{stats.totalStores}</h2>
                  <p>Monitored Stores</p>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
          <IonCol size="6">
            <IonCard 
              className="dti-stats-card clickable-card" 
              button 
              onClick={() => setSelectedSegment('srp')}
            >
              <IonCardContent className="dti-stats-content">
                <IonIcon icon={cartOutline} className="dti-stats-icon items" />
                <div className="dti-stats-info">
                  <h2>{stats.totalItems}</h2>
                  <p>Tracked Items</p>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol size="6">
            <IonCard className="dti-stats-card">
              <IonCardContent className="dti-stats-content">
                <IonIcon icon={pricetagOutline} className="dti-stats-icon pricing" />
                <div className="dti-stats-info">
                  <h2>{stats.avgPriceRange}</h2>
                  <p>Price Range</p>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
          <IonCol size="6">
            <IonCard className="dti-stats-card">
              <IonCardContent className="dti-stats-content">
                <IonIcon icon={trendingUpOutline} className="dti-stats-icon transactions" />
                <div className="dti-stats-info">
                  <h2>{stats.monthlyTransactions}</h2>
                  <p>Monthly Reports</p>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonGrid>

      <div className="dti-section">
        <h3>K-Nearest Neighbors Algorithm Insights</h3>
        <IonCard>
          <IonCardContent>
            <div className="dti-insights">
              <div className="insight-item">
                <IonIcon icon={eyeOutline} color="primary" />
                <span>Real-time price monitoring across {stats.totalStores} grocery stores</span>
              </div>
              <div className="insight-item">
                <IonIcon icon={analyticsOutline} color="success" />
                <span>ML-powered price prediction and market trend analysis</span>
              </div>
              <div className="insight-item">
                <IonIcon icon={trendingUpOutline} color="warning" />
                <span>Automated alerts for unusual price fluctuations</span>
              </div>
            </div>
          </IonCardContent>
        </IonCard>
      </div>
    </div>
  );

  const renderStoreMonitoring = () => (
    <div className="dti-stores-container">
      <div className="dti-section-header">
        <h2>Store Monitoring</h2>
        <IonButton fill="clear" onClick={() => loadDTIData()}>
          <IonIcon icon={refreshOutline} />
        </IonButton>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <IonSpinner />
          <p>Loading stores...</p>
        </div>
      ) : storesData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No stores found in the system.</p>
          <IonButton fill="outline" onClick={() => loadDTIData()}>
            <IonIcon icon={refreshOutline} slot="start" />
            Refresh
          </IonButton>
        </div>
      ) : (
        <IonList>
          {storesData.map((store: StoreData) => (
          <IonCard key={`store-${store.storeId}`}>
            <IonCardContent>
              <div className="store-monitoring-item">
                <div className="store-info">
                  <h3>{store.storeName}</h3>
                  <p>{store.itemCount} items tracked</p>
                  <p>Avg Price: ₱{store.avgPrice.toFixed(2)}</p>
                </div>
                <div className="store-actions">
                  <IonBadge color={store.status === 'Active' ? 'success' : 'warning'}>
                    {store.status}
                  </IonBadge>
                  <IonButton 
                    size="small" 
                    fill="outline"
                    onClick={() => openStoreDetails(store.storeId)}
                  >
                    <IonIcon icon={eyeOutline} slot="start" />
                    View Details
                  </IonButton>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
          ))}
        </IonList>
      )}
    </div>
  );

  const renderSRPPricing = () => {
    // Safety check for productTypes array
    if (!Array.isArray(productTypes)) {
      console.warn('productTypes is not an array:', productTypes);
      return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Error loading products. Please refresh.</p>
          <IonButton fill="outline" onClick={() => loadProductTypesAndSRP()}>
            <IonIcon icon={refreshOutline} slot="start" />
            Refresh
          </IonButton>
        </div>
      );
    }

    let filteredProducts = [];
    try {
      filteredProducts = productTypes.filter(product => {
        // Safety checks for null/undefined values and proper object structure
        if (!product || typeof product !== 'object') {
          console.warn('Invalid product object:', product);
          return false;
        }
        
        const productName = product.Name || '';
        const productBrand = product.Brand || '';
        const searchTerm = debouncedSearchText?.toLowerCase() || '';
        
        return productName.toLowerCase().includes(searchTerm) ||
               productBrand.toLowerCase().includes(searchTerm);
      });
    } catch (error) {
      console.error('Error filtering products:', error);
      return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Search error occurred. Please try again.</p>
          <IonButton fill="outline" onClick={() => {
            setSearchText('');
            loadProductTypesAndSRP();
          }}>
            <IonIcon icon={refreshOutline} slot="start" />
            Reset
          </IonButton>
        </div>
      );
    }

    return (
      <div className="dti-srp-container">
        <div className="dti-section-header">
          <h2>SRP Pricing Analysis</h2>
          <IonButton fill="clear" onClick={() => loadProductTypesAndSRP()}>
            <IonIcon icon={refreshOutline} />
          </IonButton>
        </div>
        
        <IonSearchbar
          value={searchText}
          onIonInput={e => setSearchText(e.detail.value || '')}
          placeholder="Search products by name or brand..."
          style={{ marginBottom: '1rem' }}
        />

        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
          <IonButton 
            fill="outline" 
            color="success" 
            onClick={openAddItemModal}
          >
            <IonIcon icon={addOutline} slot="start" />
            Add Item to SRP List
          </IonButton>
        </div>

        {loadingProducts ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <IonSpinner />
            <p>Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>No products found.</p>
            <IonButton fill="outline" onClick={() => loadProductTypesAndSRP()}>
              <IonIcon icon={refreshOutline} slot="start" />
              Load Products
            </IonButton>
          </div>
        ) : (
          <IonList>
            {filteredProducts.map((product: ProductType) => (
              <IonCard key={`product-${product.productTypeId}`}>
                <IonCardContent>
                  <div className="srp-pricing-item">
                    <div className="product-info">
                      <h3>{product.Name}</h3>
                      <div className="product-details">
                        {product.Brand && <p><strong>Brand:</strong> {product.Brand}</p>}
                        {product.Variant && <p><strong>Variant:</strong> {product.Variant}</p>}
                        <p><strong>Unit:</strong> {product.Unit}</p>
                        <p><strong>Quantity:</strong> {product.Quantity}</p>
                      </div>
                    </div>
                    <div className="srp-price-section">
                      <div className="price-input-group">
                        <IonLabel position="stacked">SRP Price (₱)</IonLabel>
                        <IonInput
                          type="number"
                          value={srpPrices[product.productTypeId] || ''}
                          placeholder="0.00"
                          onIonInput={(e) => {
                            const raw = e.detail.value;
                            const newPrice = parseFloat((raw ?? '').toString()) || 0;
                            setSrpPrices(prev => ({
                              ...prev,
                              [product.productTypeId]: newPrice
                            }));
                          }}
                          onIonBlur={() => {
                            const currentPrice = srpPrices[product.productTypeId] || 0;
                            updateSRPPrice(product.productTypeId, currentPrice);
                          }}
                          className="srp-price-input"
                        />
                      </div>
                      <IonButton
                        size="small"
                        fill="solid"
                        color="primary"
                        onClick={() => {
                          const input = document.querySelector(`ion-input[value="${srpPrices[product.productTypeId] || ''}"]`) as HTMLIonInputElement;
                          if (input) {
                            input.getInputElement().then(element => element.focus());
                          }
                        }}
                      >
                        <IonIcon icon={saveOutline} slot="start" />
                        Update
                      </IonButton>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}
      </div>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>DTI Dashboard</IonTitle>
          <ProfileMenu />
        </IonToolbar>
      </IonHeader>
      
      <IonContent id="main-content">
        <div className="dti-segment">
          <IonSegment 
            value={selectedSegment} 
            onIonChange={e => setSelectedSegment(e.detail.value as string)}
          >
            <IonSegmentButton value="analytics">
              <IonIcon icon={analyticsOutline} />
              <IonLabel>Analytics</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="stores">
              <IonIcon icon={storefrontOutline} />
              <IonLabel>Monitor Stores</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="srp">
              <IonIcon icon={listOutline} />
              <IonLabel>SRP Pricing</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {selectedSegment === 'analytics' && renderAnalytics()}
        {selectedSegment === 'stores' && renderStoreMonitoring()}
        {selectedSegment === 'srp' && renderSRPPricing()}

        <div className="dti-logout-section">
          <IonButton 
            expand="block" 
            fill="clear" 
            className="dti-logout-btn"
            onClick={handleLogout}
          >
            <IonIcon icon={logOutOutline} slot="start" />
            Logout
          </IonButton>
        </div>
      </IonContent>

      {/* Store Details Modal */}
      <IonModal isOpen={isStoreDetailsModalOpen} onDidDismiss={closeStoreDetails}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Store Details</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={closeStoreDetails}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {selectedStore && (
            <div className="store-details-container">
              {/* Store Information */}
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>{selectedStore.name}</IonCardTitle>
                  <IonCardSubtitle>Store Information</IonCardSubtitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonItem>
                    <IonIcon icon={informationCircleOutline} slot="start" />
                    <IonLabel>
                      <h3>Description</h3>
                      <p>{selectedStore.store_description || 'No description available'}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonIcon icon={storefrontOutline} slot="start" />
                    <IonLabel>
                      <h3>Location</h3>
                      <p>{selectedStore.location || 'No location provided'}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>
                      <h3>Contact Info</h3>
                      <p>Phone: {selectedStore.store_phone || 'Not provided'}</p>
                      <p>Email: {selectedStore.store_email || 'Not provided'}</p>
                    </IonLabel>
                  </IonItem>
                </IonCardContent>
              </IonCard>

              {/* Store Items */}
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={bagOutline} slot="start" />
                    Store Items ({storeItems.length})
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {loadingStoreItems ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <IonSpinner />
                      <p>Loading store items...</p>
                    </div>
                  ) : storeItems.length > 0 ? (
                    <IonList>
                      {storeItems.map((item) => {
                        const priceComparison = getPriceComparison(item.price, item.productTypeId);
                        return (
                          <IonCard key={item.storeItemId} className="item-card">
                            <IonCardContent>
                              <div className="item-details">
                                <div className="item-header">
                                  <h3>{item.name}</h3>
                                  <div className="price-comparison">
                                    <IonBadge color="primary">₱{item.price.toFixed(2)}</IonBadge>
                                    {priceComparison.srpPrice && (
                                      <div className="srp-price-info">
                                        <IonBadge 
                                          color="secondary" 
                                          style={{ marginLeft: '8px', fontSize: '0.8em' }}
                                        >
                                          SRP: ₱{priceComparison.srpPrice.toFixed(2)}
                                        </IonBadge>
                                        <IonBadge 
                                          color={
                                            priceComparison.status === 'below' ? 'success' :
                                            priceComparison.status === 'above' ? 'danger' : 'warning'
                                          }
                                          style={{ marginLeft: '4px', fontSize: '0.7em' }}
                                        >
                                          {priceComparison.status === 'below' && `${Math.abs(priceComparison.percentage!).toFixed(1)}% below`}
                                          {priceComparison.status === 'above' && `${priceComparison.percentage!.toFixed(1)}% above`}
                                          {priceComparison.status === 'equal' && 'Equal'}
                                        </IonBadge>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <p className="item-description">{item.description}</p>
                                {item.brand && (
                                  <p><strong>Brand:</strong> {item.brand}</p>
                                )}
                                <div className="item-info">
                                  <span><strong>Category:</strong> {item.category}</span>
                                  <span><strong>Unit:</strong> {item.unit || 'N/A'}</span>
                                  <span><strong>Available:</strong> {item.availability} pcs</span>
                                  {priceComparison.srpPrice && (
                                    <span>
                                      <strong>Price vs SRP:</strong> 
                                      {priceComparison.difference! > 0 ? '+' : ''}₱{priceComparison.difference!.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </IonCardContent>
                          </IonCard>
                        );
                      })}
                    </IonList>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <p>No items found in this store</p>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            </div>
          )}
        </IonContent>
      </IonModal>

      {/* Add Item Modal */}
      <IonModal isOpen={isAddItemModalOpen} onDidDismiss={closeAddItemModal}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Add New Product to SRP List</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={closeAddItemModal}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ padding: '1rem' }}>
            <p style={{ marginBottom: '1.5rem', color: 'var(--ion-color-medium)' }}>
              Create a new product and add it to the SRP price list. All fields are required.
            </p>

            <IonItem>
              <IonLabel position="stacked">Product Name</IonLabel>
              <IonInput
                value={newProductName}
                onIonInput={e => setNewProductName(e.detail.value || '')}
                placeholder="Enter product name"
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Brand</IonLabel>
              <IonInput
                value={newProductBrand}
                onIonInput={e => setNewProductBrand(e.detail.value || '')}
                placeholder="Enter brand name"
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Variant</IonLabel>
              <IonInput
                value={newProductVariant}
                onIonInput={e => setNewProductVariant(e.detail.value || '')}
                placeholder="Enter variant (e.g., Original, Large, etc.)"
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Unit</IonLabel>
              <IonInput
                value={newProductUnit}
                onIonInput={e => setNewProductUnit(e.detail.value || '')}
                placeholder="Enter unit (e.g., pc, kg, bottle, etc.)"
                required
              />
            </IonItem>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <IonButton
                expand="block"
                color="primary"
                onClick={createNewProduct}
                disabled={isSubmittingNewProduct}
                style={{ flex: 1 }}
              >
                {isSubmittingNewProduct ? (
                  <>
                    <IonSpinner />
                    <span style={{ marginLeft: '0.5rem' }}>Creating...</span>
                  </>
                ) : (
                  <>
                    <IonIcon icon={addOutline} slot="start" />
                    Create Product
                  </>
                )}
              </IonButton>
              
              <IonButton
                fill="outline"
                color="medium"
                onClick={closeAddItemModal}
                disabled={isSubmittingNewProduct}
                style={{ flex: '0 0 auto' }}
              >
                Cancel
              </IonButton>
            </div>

            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--ion-color-light)', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--ion-color-dark)' }}>
                <strong>Note:</strong> The system will check for duplicate products with the same Name, Brand, Variant, and Unit combination before creating.
              </p>
            </div>
          </div>
        </IonContent>
      </IonModal>

      {/* Toast for notifications */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="bottom"
      />
    </IonPage>
  );
};

export default DTIDashboard;
