// Debug script to check the actual GROCERY_STORE table schema
// Run this in your browser console or as a Node.js script

import { supabase } from './src/services/supabaseService.js';

async function debugSchema() {
    try {
        // Try to get the current user
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Current user:', user?.id);
        
        // Try to select everything from GROCERY_STORE to see actual column names
        const { data, error } = await supabase
            .from('GROCERY_STORE')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Sample data (shows column names):', data);
            if (data && data.length > 0) {
                console.log('Actual column names:', Object.keys(data[0]));
            } else {
                console.log('No data found in table');
            }
        }
        
        // Also try to insert a test record to see what happens
        console.log('\n--- Testing insert with different column names ---');
        
        if (user) {
            const testData = {
                name: 'Test Store',
                store_description: 'Test Description',
                store_address: 'Test Address',
                store_phone: '123-456-7890',
                store_email: 'test@test.com',
                store_image_url: 'https://example.com/image.jpg',
                owner_id: user.id
            };
            
            const { data: insertData, error: insertError } = await supabase
                .from('GROCERY_STORE')
                .insert([testData])
                .select();
                
            if (insertError) {
                console.error('Insert error:', insertError);
            } else {
                console.log('Insert successful:', insertData);
                
                // Clean up - delete the test record
                if (insertData && insertData[0]) {
                    await supabase
                        .from('GROCERY_STORE')
                        .delete()
                        .eq('storeId', insertData[0].storeId);
                    console.log('Test record cleaned up');
                }
            }
        }
        
    } catch (error) {
        console.error('Debug error:', error);
    }
}

// Run the debug function
debugSchema();
