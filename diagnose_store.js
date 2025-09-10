// Diagnostic script to check store information loading
// Paste this in browser console when logged in

(async function diagnoseStoreInfo() {
    console.log('🔍 Diagnosing store information loading...');
    
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('❌ Not logged in');
            return;
        }
        console.log('✅ User ID:', user.id);
        
        // Check what's actually in the GROCERY_STORE table for this user
        const { data: storeData, error: storeError } = await supabase
            .from('GROCERY_STORE')
            .select('*')
            .eq('owner_id', user.id)
            .single();
            
        if (storeError) {
            console.error('❌ Error loading store:', storeError);
            console.log('🔍 Error details:', {
                code: storeError.code,
                message: storeError.message,
                details: storeError.details
            });
        } else if (storeData) {
            console.log('✅ Store data found:', storeData);
            console.log('🔍 Available columns:', Object.keys(storeData));
            console.log('📊 Column values:');
            Object.keys(storeData).forEach(key => {
                console.log(`  ${key}: ${storeData[key]}`);
            });
            
            // Check which ID column exists
            const possibleIdColumns = ['store_id', 'storeId', 'id', 'storeid'];
            const foundIdColumn = possibleIdColumns.find(col => storeData[col] !== undefined);
            if (foundIdColumn) {
                console.log(`🎯 Primary key column: ${foundIdColumn} = ${storeData[foundIdColumn]}`);
            } else {
                console.log('❌ No primary key column found among:', possibleIdColumns);
            }
        } else {
            console.log('❌ No store data found for this user');
        }
        
        // Also check all stores to see the schema
        console.log('\n📋 Checking table schema...');
        const { data: allStores, error: allError } = await supabase
            .from('GROCERY_STORE')
            .select('*')
            .limit(1);
            
        if (allError) {
            console.error('❌ Error checking schema:', allError);
        } else if (allStores && allStores.length > 0) {
            console.log('🏗️ Table schema (from first record):', Object.keys(allStores[0]));
        }
        
    } catch (error) {
        console.error('❌ Diagnostic error:', error);
    }
})();
