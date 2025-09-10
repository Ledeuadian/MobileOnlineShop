// Test script to check exact GROCERY_STORE column names
// Paste this into your browser console when logged into your app

(async function testDatabaseSchema() {
    console.log('🧪 Testing GROCERY_STORE table schema...');
    
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('❌ Not logged in');
            return;
        }
        console.log('✅ User ID:', user.id);
        
        // First, let's see if there's any existing data
        console.log('\n📊 Checking for existing data...');
        const { data: existingData, error: selectError } = await supabase
            .from('GROCERY_STORE')
            .select('*')
            .eq('owner_id', user.id);
            
        if (selectError) {
            console.error('❌ Select error:', selectError);
        } else {
            console.log('✅ Existing data:', existingData);
            if (existingData && existingData.length > 0) {
                console.log('🔍 Column names from existing data:', Object.keys(existingData[0]));
            }
        }
        
        // Test different column name combinations
        console.log('\n🧪 Testing column name combinations...');
        
        const testConfigs = [
            {
                name: 'Test 1: Snake case with store_id',
                data: {
                    name: 'Test Store 1',
                    store_description: 'Test Description',
                    store_address: 'Test Address',
                    store_phone: '123-456-7890',
                    store_email: 'test1@test.com',
                    store_image_url: 'https://example.com/image1.jpg',
                    owner_id: user.id
                }
            },
            {
                name: 'Test 2: CamelCase with storeId',  
                data: {
                    storeName: 'Test Store 2',
                    storeDescription: 'Test Description',
                    store_address: 'Test Address',
                    store_phone: '123-456-7890',
                    store_email: 'test2@test.com',
                    store_image_url: 'https://example.com/image2.jpg',
                    owner_id: user.id
                }
            }
        ];
        
        for (const config of testConfigs) {
            console.log(`\n${config.name}:`);
            const { data: insertData, error: insertError } = await supabase
                .from('GROCERY_STORE')
                .insert([config.data])
                .select();
                
            if (insertError) {
                console.error('❌ Insert error:', insertError);
            } else {
                console.log('✅ Insert successful:', insertData);
                if (insertData && insertData[0]) {
                    console.log('🔍 Returned column names:', Object.keys(insertData[0]));
                    
                    // Clean up - try to delete using different ID column names
                    let deleteSuccess = false;
                    for (const idCol of ['store_id', 'storeId', 'id']) {
                        if (insertData[0][idCol]) {
                            const { error: deleteError } = await supabase
                                .from('GROCERY_STORE')
                                .delete()
                                .eq(idCol, insertData[0][idCol]);
                            
                            if (!deleteError) {
                                console.log(`🧹 Cleaned up using ${idCol}`);
                                deleteSuccess = true;
                                break;
                            }
                        }
                    }
                    
                    if (!deleteSuccess) {
                        console.warn('⚠️ Could not clean up test record');
                    }
                }
                break; // If one works, use that pattern
            }
        }
        
        console.log('\n✅ Schema test complete!');
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
})();
