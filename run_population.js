import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://jugtklulvvpcpfsrdxom.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Z3RrbHVsdnZwY3Bmc3JkeG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzE1MzksImV4cCI6MjA3MjIwNzUzOX0.odMPsM_N9glo3J-1aUSA6OSlRGfVT5X5O2SSFvZa9CQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// Product data to insert
const products = [
  // Dairy Products
  { Name: 'Milk', Brand: 'Alaska', Variant: 'Fresh Milk', Unit: 'liter', Quantity: 1 },
  { Name: 'Milk', Brand: 'Bear Brand', Variant: 'Sterilized Milk', Unit: 'can 300ml', Quantity: 1 },
  { Name: 'Milk', Brand: 'Nestle', Variant: 'All Purpose Cream', Unit: 'pack 250ml', Quantity: 1 },
  { Name: 'Cheese', Brand: 'Eden', Variant: 'Processed Cheese', Unit: 'pack 200g', Quantity: 1 },
  { Name: 'Cheese', Brand: 'Kraft', Variant: 'Cheddar Cheese', Unit: 'pack 165g', Quantity: 1 },
  { Name: 'Butter', Brand: 'Star Margarine', Variant: 'Regular', Unit: 'pack 200g', Quantity: 1 },
  { Name: 'Yogurt', Brand: 'Nestle', Variant: 'Greek Style', Unit: 'cup 150g', Quantity: 1 },
  { Name: 'Condensed Milk', Brand: 'Alaska', Variant: 'Sweetened', Unit: 'can 300ml', Quantity: 1 },
  { Name: 'Evaporated Milk', Brand: 'Carnation', Variant: 'Regular', Unit: 'can 370ml', Quantity: 1 },

  // Meat Products
  { Name: 'Chicken', Brand: 'Fresh', Variant: 'Whole Chicken', Unit: 'kg', Quantity: 1 },
  { Name: 'Chicken', Brand: 'Fresh', Variant: 'Chicken Breast', Unit: 'kg', Quantity: 1 },
  { Name: 'Chicken', Brand: 'Fresh', Variant: 'Chicken Thigh', Unit: 'kg', Quantity: 1 },
  { Name: 'Pork', Brand: 'Fresh', Variant: 'Pork Belly', Unit: 'kg', Quantity: 1 },
  { Name: 'Pork', Brand: 'Fresh', Variant: 'Pork Shoulder', Unit: 'kg', Quantity: 1 },
  { Name: 'Beef', Brand: 'Fresh', Variant: 'Ground Beef', Unit: 'kg', Quantity: 1 },
  { Name: 'Fish', Brand: 'Fresh', Variant: 'Bangus', Unit: 'kg', Quantity: 1 },
  { Name: 'Fish', Brand: 'Fresh', Variant: 'Tilapia', Unit: 'kg', Quantity: 1 },
  { Name: 'Hotdog', Brand: 'CDO', Variant: 'Tender Juicy', Unit: 'pack 500g', Quantity: 1 },
  { Name: 'Bacon', Brand: 'Purefoods', Variant: 'Sliced Bacon', Unit: 'pack 200g', Quantity: 1 },

  // Rice and Grains
  { Name: 'Rice', Brand: 'Dinorado', Variant: 'Premium', Unit: 'kg', Quantity: 1 },
  { Name: 'Rice', Brand: 'Jasmine', Variant: 'Fragrant Rice', Unit: 'kg', Quantity: 1 },
  { Name: 'Rice', Brand: 'Sinandomeng', Variant: 'Well Milled', Unit: 'kg', Quantity: 1 },
  { Name: 'Oats', Brand: 'Quaker', Variant: 'Quick Cooking', Unit: 'pack 400g', Quantity: 1 },
  { Name: 'Bread', Brand: 'Gardenia', Variant: 'Classic White', Unit: 'loaf', Quantity: 1 },
  { Name: 'Bread', Brand: 'Gardenia', Variant: 'Wheat Bread', Unit: 'loaf', Quantity: 1 },
  { Name: 'Pandesal', Brand: 'Local Bakery', Variant: 'Fresh Baked', Unit: 'pack 10pcs', Quantity: 1 },

  // Fruits
  { Name: 'Apple', Brand: 'Fresh', Variant: 'Red Delicious', Unit: 'kg', Quantity: 1 },
  { Name: 'Banana', Brand: 'Fresh', Variant: 'Saba', Unit: 'kg', Quantity: 1 },
  { Name: 'Banana', Brand: 'Fresh', Variant: 'Lakatan', Unit: 'kg', Quantity: 1 },
  { Name: 'Orange', Brand: 'Fresh', Variant: 'Valencia', Unit: 'kg', Quantity: 1 },
  { Name: 'Mango', Brand: 'Fresh', Variant: 'Carabao', Unit: 'kg', Quantity: 1 },
  { Name: 'Grapes', Brand: 'Fresh', Variant: 'Red Globe', Unit: 'kg', Quantity: 1 },
  { Name: 'Pineapple', Brand: 'Fresh', Variant: 'Sweet Del Monte', Unit: 'pc', Quantity: 1 },
  { Name: 'Watermelon', Brand: 'Fresh', Variant: 'Regular', Unit: 'kg', Quantity: 1 },
  { Name: 'Papaya', Brand: 'Fresh', Variant: 'Ripe', Unit: 'kg', Quantity: 1 },

  // Vegetables
  { Name: 'Onion', Brand: 'Fresh', Variant: 'Red Onion', Unit: 'kg', Quantity: 1 },
  { Name: 'Onion', Brand: 'Fresh', Variant: 'White Onion', Unit: 'kg', Quantity: 1 },
  { Name: 'Garlic', Brand: 'Fresh', Variant: 'Native', Unit: 'kg', Quantity: 1 },
  { Name: 'Tomato', Brand: 'Fresh', Variant: 'Regular', Unit: 'kg', Quantity: 1 },
  { Name: 'Potato', Brand: 'Fresh', Variant: 'Regular', Unit: 'kg', Quantity: 1 },
  { Name: 'Carrot', Brand: 'Fresh', Variant: 'Regular', Unit: 'kg', Quantity: 1 },
  { Name: 'Cabbage', Brand: 'Fresh', Variant: 'Regular', Unit: 'kg', Quantity: 1 },
  { Name: 'Lettuce', Brand: 'Fresh', Variant: 'Iceberg', Unit: 'head', Quantity: 1 },
  { Name: 'Bell Pepper', Brand: 'Fresh', Variant: 'Green', Unit: 'kg', Quantity: 1 },
  { Name: 'Eggplant', Brand: 'Fresh', Variant: 'Regular', Unit: 'kg', Quantity: 1 },

  // Canned Goods
  { Name: 'Corned Beef', Brand: 'Argentina', Variant: 'Original', Unit: 'can 175g', Quantity: 1 },
  { Name: 'Corned Beef', Brand: 'Libby\'s', Variant: 'Regular', Unit: 'can 175g', Quantity: 1 },
  { Name: 'Sardines', Brand: 'Ligo', Variant: 'in Tomato Sauce', Unit: 'can 155g', Quantity: 1 },
  { Name: 'Sardines', Brand: 'Century', Variant: 'in Natural Oil', Unit: 'can 155g', Quantity: 1 },
  { Name: 'Tuna', Brand: 'Century', Variant: 'Flakes in Oil', Unit: 'can 180g', Quantity: 1 },
  { Name: 'Spam', Brand: 'Hormel', Variant: 'Classic', Unit: 'can 340g', Quantity: 1 },
  { Name: 'Tomato Sauce', Brand: 'Del Monte', Variant: 'Sweet Style', Unit: 'pack 250g', Quantity: 1 },
  { Name: 'Tomato Paste', Brand: 'Hunt\'s', Variant: 'Regular', Unit: 'can 70g', Quantity: 1 },

  // Condiments and Seasonings
  { Name: 'Soy Sauce', Brand: 'Silver Swan', Variant: 'Special', Unit: 'bottle 385ml', Quantity: 1 },
  { Name: 'Vinegar', Brand: 'Datu Puti', Variant: 'Spiced', Unit: 'bottle 385ml', Quantity: 1 },
  { Name: 'Fish Sauce', Brand: 'Rufina', Variant: 'Patis', Unit: 'bottle 350ml', Quantity: 1 },
  { Name: 'Oyster Sauce', Brand: 'Lee Kum Kee', Variant: 'Premium', Unit: 'bottle 510g', Quantity: 1 },
  { Name: 'Ketchup', Brand: 'Del Monte', Variant: 'Sweet Style', Unit: 'bottle 320g', Quantity: 1 },
  { Name: 'Mayonnaise', Brand: 'Lady\'s Choice', Variant: 'Real', Unit: 'bottle 220ml', Quantity: 1 },
  { Name: 'Salt', Brand: 'Tide', Variant: 'Iodized', Unit: 'pack 500g', Quantity: 1 },
  { Name: 'Sugar', Brand: 'Brown Sugar', Variant: 'Muscovado', Unit: 'kg', Quantity: 1 },
  { Name: 'Sugar', Brand: 'White Sugar', Variant: 'Refined', Unit: 'kg', Quantity: 1 },

  // Beverages
  { Name: 'Soft Drink', Brand: 'Coca Cola', Variant: 'Regular', Unit: 'bottle 1.5L', Quantity: 1 },
  { Name: 'Soft Drink', Brand: 'Pepsi', Variant: 'Regular', Unit: 'bottle 1.5L', Quantity: 1 },
  { Name: 'Water', Brand: 'Nature\'s Spring', Variant: 'Purified', Unit: 'bottle 500ml', Quantity: 1 },
  { Name: 'Coffee', Brand: 'Nescafe', Variant: '3 in 1 Original', Unit: 'pack 10sachets', Quantity: 1 },

  // Snacks
  { Name: 'Biscuit', Brand: 'Skyflakes', Variant: 'Crackers', Unit: 'pack 800g', Quantity: 1 },
  { Name: 'Chips', Brand: 'Piattos', Variant: 'Cheese', Unit: 'pack 85g', Quantity: 1 },

  // Personal Care
  { Name: 'Shampoo', Brand: 'Pantene', Variant: 'Hair Fall Control', Unit: 'bottle 340ml', Quantity: 1 },
  { Name: 'Soap', Brand: 'Safeguard', Variant: 'White', Unit: 'bar 135g', Quantity: 1 },
  { Name: 'Toothpaste', Brand: 'Colgate', Variant: 'Total', Unit: 'tube 150g', Quantity: 1 },

  // Household Items
  { Name: 'Detergent', Brand: 'Tide', Variant: 'Powder', Unit: 'pack 500g', Quantity: 1 },
  { Name: 'Dishwashing Liquid', Brand: 'Joy', Variant: 'Lemon', Unit: 'bottle 485ml', Quantity: 1 }
];

// Sample stores data
const stores = [
  {
    storeName: 'SM Supermarket Suarez',
    storeDescription: 'Complete supermarket with fresh produce and household items',
    store_address: 'Suarez Street, Iloilo City',
    store_phone: '033-123-4567',
    store_email: 'suarez@sm.com.ph',
    store_image_url: 'https://example.com/sm-suarez.jpg'
  },
  {
    storeName: 'Gaisano Grand Mall Grocery',
    storeDescription: 'One-stop grocery store for all your needs',
    store_address: 'Diversion Road, Iloilo City',
    store_phone: '033-234-5678',
    store_email: 'grocery@gaisano.com.ph',
    store_image_url: 'https://example.com/gaisano-grand.jpg'
  },
  {
    storeName: 'Robinsons Supermarket',
    storeDescription: 'Premium grocery shopping experience',
    store_address: 'Robinsons Place Iloilo',
    store_phone: '033-345-6789',
    store_email: 'supermarket@robinsons.com.ph',
    store_image_url: 'https://example.com/robinsons.jpg'
  }
];

async function populateDatabase() {
  console.log('🚀 Starting database population...\n');

  try {
    // 1. Insert products into PRODUCT_TYPE
    console.log('📦 Inserting products into PRODUCT_TYPE table...');
    
    const { data: productData, error: productError } = await supabase
      .from('PRODUCT_TYPE')
      .insert(products)
      .select();

    if (productError) {
      console.error('❌ Error inserting products:', productError);
      return;
    }

    console.log(`✅ Successfully inserted ${productData.length} products`);

    // 2. Insert stores (note: you may need to add actual owner_id values)
    console.log('\n🏪 Inserting stores into GROCERY_STORE table...');
    
    // For now, we'll skip store insertion since it requires valid owner_id from auth.users
    // You can manually add stores with valid owner_ids in the Supabase dashboard
    
    console.log('⚠️  Store insertion skipped - requires valid owner_id from auth.users');
    console.log('   You can manually add stores in the Supabase dashboard');

    // 3. Show summary
    console.log('\n📊 Database Population Summary:');
    console.log('================================');
    console.log(`✅ Products inserted: ${productData.length}`);
    console.log('⚠️  Stores: Manual insertion required');
    console.log('⚠️  Store items: Requires stores to be created first');

    // 4. Test the database
    console.log('\n🔍 Testing database...');
    
    const { data: testData, error: testError } = await supabase
      .from('PRODUCT_TYPE')
      .select('Name, Brand, Variant, Unit')
      .limit(5);

    if (!testError && testData) {
      console.log('\n📋 Sample products in database:');
      testData.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.Name} - ${product.Brand} ${product.Variant} (${product.Unit})`);
      });
    }

    console.log('\n🎉 Database population completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Add stores manually in Supabase dashboard with valid owner_id');
    console.log('   2. Run store items population after stores are created');
    console.log('   3. Set up SRP prices for products');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the script
populateDatabase();