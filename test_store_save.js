// Quick test for store information saving
// Paste this in browser console when logged in to test

(async function testStoreSave() {
    console.log('🧪 Testing store information save...');
    
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('❌ Not logged in');
            return;
        }
        console.log('✅ User ID:', user.id);
        
        // Test store data with different column name combinations
        const testStoreData = {
            name: 'Test Store',
            store_description: 'A test grocery store',
            store_address: '123 Test Street, Test City',
            store_phone: '555-0123',
            store_email: 'test@teststore.com',
            store_image_url: 'https://example.com/store.jpg',
            owner_id: user.id
        };
        
        console.log('📝 Attempting to insert store data:', testStoreData);
        
        const { data: insertData, error: insertError } = await supabase
            .from('GROCERY_STORE')
            .insert([testStoreData])
            .select();
            
        if (insertError) {
            console.error('❌ Insert error:', insertError);
            console.log('🔍 Error details:', {
                code: insertError.code,
                message: insertError.message,
                details: insertError.details,
                hint: insertError.hint
            });
        } else {
            console.log('✅ Insert successful:', insertData);
            if (insertData && insertData[0]) {
                console.log('🔍 Returned column names:', Object.keys(insertData[0]));
                
                // Clean up test data
                const storeId = insertData[0].store_id || insertData[0].storeId || insertData[0].id;
                if (storeId) {
                    await supabase
                        .from('GROCERY_STORE')
                        .delete()
                        .eq('store_id', storeId);
                    console.log('🧹 Test data cleaned up');
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
})();
