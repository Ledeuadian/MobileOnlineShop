import { supabase } from '../services/supabaseService';

// Test function to verify PRODUCT_TYPE data
export const testProductTypes = async () => {
  try {
    console.log('Testing PRODUCT_TYPE table...');
    
    // Test basic query
    const { data, error } = await supabase
      .from('PRODUCT_TYPE')
      .select('productTypeId, Name, Brand, Variant, Unit')
      .limit(10);

    if (error) {
      console.error('Error fetching product types:', error);
      return false;
    }

    console.log('Sample product types:', data);
    console.log(`Total items fetched: ${data?.length || 0}`);
    
    return data;
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
};

// Test the connection and query
testProductTypes();
