import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseService';

const DatabaseTest: React.FC = () => {
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testDatabase = async () => {
      try {
        console.log('🧪 Testing database connection...');
        
        // Test 1: Get all items
        const { data: allItems, error: allError } = await supabase
          .from('ITEMS_IN_STORE')
          .select('*')
          .limit(10);
        
        console.log('📊 All items:', { count: allItems?.length, items: allItems, error: allError });
        
        // Test 2: Get items by category
        const { data: categoryItems, error: categoryError } = await supabase
          .from('ITEMS_IN_STORE')
          .select('*')
          .eq('category', 'Fruits & Vegetables');
        
        console.log('🥬 Fruits & Vegetables items:', { 
          count: categoryItems?.length, 
          items: categoryItems, 
          error: categoryError 
        });
        
        // Test 3: Get distinct categories
        const { data: categories } = await supabase
          .from('ITEMS_IN_STORE')
          .select('category')
          .not('category', 'is', null);
        
        const uniqueCategories = [...new Set(categories?.map(item => item.category))];
        console.log('📝 Available categories:', uniqueCategories);
        
        setResults(categoryItems || []);
        
      } catch (error) {
        console.error('❌ Database test error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    testDatabase();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px' }}>Testing database...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Database Test Results</h2>
      <p>Found {results.length} items in "Fruits & Vegetables" category</p>
      <pre style={{ background: '#f5f5f5', padding: '10px', fontSize: '12px', overflow: 'auto' }}>
        {JSON.stringify(results, null, 2)}
      </pre>
    </div>
  );
};

export default DatabaseTest;
