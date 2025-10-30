import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://jugtklulvvpcpfsrdxom.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Z3RrbHVsdnZwY3Bmc3JkeG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzE1MzksImV4cCI6MjA3MjIwNzUzOX0.odMPsM_N9glo3J-1aUSA6OSlRGfVT5X5O2SSFvZa9CQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createStoresAndItems() {
  console.log('🏪 Creating stores and inventory...\n');

  try {
    // First, let's check if we have any users in the system
    console.log('👥 Checking for existing users...');
    
    const { data: users, error: userError } = await supabase
      .from('USER')
      .select('auth_user_id, email')
      .limit(5);

    if (userError) {
      console.log('⚠️  Cannot access USER table:', userError.message);
      console.log('   Creating stores without owner_id (for demo purposes)');
    } else if (users && users.length > 0) {
      console.log(`✅ Found ${users.length} users in the system`);
    }

    // Create sample stores
    console.log('\n🏪 Creating sample grocery stores...');
    
    // First get a user ID to use as owner_id
    let ownerId = null;
    if (users && users.length > 0) {
      ownerId = users[0].auth_user_id;
      console.log(`   Using owner_id: ${ownerId}`);
    }
    
    const stores = [
      {
        storeName: 'SM Supermarket Suarez',
        store_description: 'Complete supermarket with fresh produce and household items',
        store_address: 'Suarez Street, Iloilo City',
        store_phone: '033-123-4567',
        store_email: 'suarez@sm.com.ph',
        store_image_url: 'https://example.com/sm-suarez.jpg',
        owner_id: ownerId
      },
      {
        storeName: 'Gaisano Grand Mall Grocery',
        store_description: 'One-stop grocery store for all your needs',
        store_address: 'Diversion Road, Iloilo City',
        store_phone: '033-234-5678',
        store_email: 'grocery@gaisano.com.ph',
        store_image_url: 'https://example.com/gaisano-grand.jpg',
        owner_id: ownerId
      },
      {
        storeName: 'Robinsons Supermarket',
        store_description: 'Premium grocery shopping experience',
        store_address: 'Robinsons Place Iloilo',
        store_phone: '033-345-6789',
        store_email: 'supermarket@robinsons.com.ph',
        store_image_url: 'https://example.com/robinsons.jpg',
        owner_id: ownerId
      }
    ];

    const { data: storeData, error: storeError } = await supabase
      .from('GROCERY_STORE')
      .insert(stores)
      .select();

    if (storeError) {
      console.error('❌ Error creating stores:', storeError.message);
      return;
    }

    console.log(`✅ Successfully created ${storeData.length} stores`);

    // Now create sample inventory for each store
    console.log('\n📦 Creating store inventory...');

    // Get some products from PRODUCT_TYPE table
    const { data: products, error: productError } = await supabase
      .from('PRODUCT_TYPE')
      .select('productTypeId, Name, Brand, Variant, Unit')
      .limit(20);

    if (productError) {
      console.error('❌ Error fetching products:', productError);
      return;
    }

    // Create inventory items for each store
    const inventoryItems = [];
    
    storeData.forEach((store, storeIndex) => {
      products.forEach((product, productIndex) => {
        // Create realistic pricing based on product type
        let price = 50; // default price
        
        if (product.Name === 'Rice') price = 65;
        else if (product.Name === 'Milk') price = 85;
        else if (product.Name === 'Chicken') price = 180;
        else if (product.Name === 'Beef') price = 320;
        else if (product.Name === 'Pork') price = 280;
        else if (product.Name === 'Fish') price = 160;
        else if (product.Name === 'Apple') price = 180;
        else if (product.Name === 'Banana') price = 45;
        else if (product.Name === 'Onion') price = 80;
        else if (product.Name === 'Garlic') price = 140;
        else if (product.Name === 'Corned Beef') price = 55;
        else if (product.Name === 'Sardines') price = 25;
        else if (product.Name === 'Soy Sauce') price = 30;
        else if (product.Name === 'Soft Drink') price = 75;
        
        // Add some variation between stores
        const priceVariation = (storeIndex * 5) - 5; // -5 to +5
        price += priceVariation;
        
        const quantity = Math.floor(Math.random() * 100) + 20; // 20-120 items
        
        inventoryItems.push({
          storeId: store.storeId,
          name: `${product.Brand} ${product.Name}`,
          description: `${product.Brand} ${product.Name} - ${product.Variant}`,
          category: getCategoryFromProduct(product.Name),
          price: price,
          availability: quantity,
          item_image_url: `https://example.com/${product.Name.toLowerCase()}.jpg`,
          item_name: `${product.Brand} ${product.Name}`,
          item_description: `${product.Brand} ${product.Name} - ${product.Variant}`,
          item_price: price,
          item_quantity: quantity,
          item_category: getCategoryFromProduct(product.Name)
        });
      });
    });

    // Insert inventory items in batches to avoid timeout
    const batchSize = 50;
    let totalInserted = 0;
    
    for (let i = 0; i < inventoryItems.length; i += batchSize) {
      const batch = inventoryItems.slice(i, i + batchSize);
      
      const { error: itemError } = await supabase
        .from('ITEMS_IN_STORE')
        .insert(batch);

      if (itemError) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, itemError.message);
      } else {
        totalInserted += batch.length;
        console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1} (${batch.length} items)`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Stores created: ${storeData.length}`);
    console.log(`✅ Inventory items created: ${totalInserted}`);
    
    // Show store inventory summary
    console.log('\n🏪 Store Inventory Summary:');
    for (const store of storeData) {
      const { data: storeItems } = await supabase
        .from('ITEMS_IN_STORE')
        .select('storeItemId, item_price')
        .eq('storeId', store.storeId);
      
      if (storeItems) {
        const itemCount = storeItems.length;
        const avgPrice = storeItems.reduce((sum, item) => sum + parseFloat(item.item_price), 0) / itemCount;
        console.log(`   📍 ${store.storeName}: ${itemCount} items, avg price ₱${avgPrice.toFixed(2)}`);
      }
    }

    console.log('\n🎉 Store creation and inventory population completed!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

function getCategoryFromProduct(productName) {
  const categories = {
    'Rice': 'Rice & Grains',
    'Bread': 'Rice & Grains',
    'Oats': 'Rice & Grains',
    'Milk': 'Dairy',
    'Cheese': 'Dairy',
    'Butter': 'Dairy',
    'Yogurt': 'Dairy',
    'Chicken': 'Meat',
    'Pork': 'Meat',
    'Beef': 'Meat',
    'Fish': 'Meat',
    'Hotdog': 'Meat',
    'Bacon': 'Meat',
    'Apple': 'Fruits',
    'Banana': 'Fruits',
    'Orange': 'Fruits',
    'Mango': 'Fruits',
    'Grapes': 'Fruits',
    'Pineapple': 'Fruits',
    'Watermelon': 'Fruits',
    'Papaya': 'Fruits',
    'Onion': 'Vegetables',
    'Garlic': 'Vegetables',
    'Tomato': 'Vegetables',
    'Potato': 'Vegetables',
    'Carrot': 'Vegetables',
    'Cabbage': 'Vegetables',
    'Lettuce': 'Vegetables',
    'Bell Pepper': 'Vegetables',
    'Eggplant': 'Vegetables',
    'Corned Beef': 'Canned Goods',
    'Sardines': 'Canned Goods',
    'Tuna': 'Canned Goods',
    'Spam': 'Canned Goods',
    'Soy Sauce': 'Condiments',
    'Vinegar': 'Condiments',
    'Ketchup': 'Condiments',
    'Soft Drink': 'Beverages',
    'Water': 'Beverages',
    'Coffee': 'Beverages',
    'Biscuit': 'Snacks',
    'Chips': 'Snacks',
    'Shampoo': 'Personal Care',
    'Soap': 'Personal Care',
    'Toothpaste': 'Personal Care',
    'Detergent': 'Household'
  };
  
  return categories[productName] || 'Other';
}

// Run the script
createStoresAndItems();