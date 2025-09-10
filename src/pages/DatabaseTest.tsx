import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSpinner
} from '@ionic/react';

const DatabaseTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testDatabase = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      // Test 1: Get all distinct categories
      const { data: categories, error: catError } = await supabase
        .from('ITEMS_IN_STORE')
        .select('category')
        .not('category', 'is', null);
      
      const uniqueCategories = [...new Set(categories?.map(item => item.category))];
      
      // Test 2: Get count of items per category
      const categoryDetails = await Promise.all(
        uniqueCategories.map(async (category) => {
          const { data, count } = await supabase
            .from('ITEMS_IN_STORE')
            .select('*', { count: 'exact' })
            .eq('category', category);
          
          return {
            category,
            count,
            sampleItems: data?.slice(0, 3).map(item => ({
              name: item.name,
              price: item.price,
              unit: item.unit
            }))
          };
        })
      );

      // Test 3: Specific test for Beverages
      const { data: beverages, error: bevError } = await supabase
        .from('ITEMS_IN_STORE')
        .select('*')
        .eq('category', 'Beverages');

      setResults({
        allCategories: uniqueCategories,
        categoryDetails,
        beveragesTest: {
          count: beverages?.length || 0,
          items: beverages?.slice(0, 5),
          error: bevError
        },
        errors: {
          categories: catError,
          beverages: bevError
        }
      });
      
    } catch (error) {
      console.error('Database test error:', error);
      setResults({ error: error });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testDatabase();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Database Test</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <IonButton expand="block" onClick={testDatabase} disabled={loading}>
          {loading ? <IonSpinner /> : 'Test Database'}
        </IonButton>

        {results && (
          <div>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Available Categories</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <pre>{JSON.stringify(results.allCategories, null, 2)}</pre>
              </IonCardContent>
            </IonCard>

            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Category Details</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <pre>{JSON.stringify(results.categoryDetails, null, 2)}</pre>
              </IonCardContent>
            </IonCard>

            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Beverages Test</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <pre>{JSON.stringify(results.beveragesTest, null, 2)}</pre>
              </IonCardContent>
            </IonCard>

            {results.errors && (
              <IonCard color="danger">
                <IonCardHeader>
                  <IonCardTitle>Errors</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <pre>{JSON.stringify(results.errors, null, 2)}</pre>
                </IonCardContent>
              </IonCard>
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default DatabaseTest;
