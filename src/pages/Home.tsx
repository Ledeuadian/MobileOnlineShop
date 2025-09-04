import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase, checkUserApprovalStatus } from '../services/supabaseService';
import {
  IonPage, 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonSearchbar,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonMenuToggle
} from '@ionic/react';
import { star, heart, cartOutline, locationOutline, storefrontOutline, personOutline } from 'ionicons/icons';
import ProfileMenu from '../components/ProfileMenu';
import './Home.css';

const Home: React.FC = () => {
  console.log('Home component mounting...');
  const history = useHistory();
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user?.email) {
        // Check user status and redirect if needed
        try {
          const approvalResult = await checkUserApprovalStatus(data.session.user.email);
          if (approvalResult?.data) {
            // Redirect ADMIN users (userTypeCode === 1) to Admin Dashboard
            if (approvalResult.data.userTypeCode === 1 && approvalResult.data.approval_status === 'approved') {
              history.push('/admin-dashboard');
              return;
            }
            
            // Redirect STORE users (userTypeCode === 3) to Store Dashboard  
            if (approvalResult.data.userTypeCode === 3 && approvalResult.data.approval_status === 'approved') {
              history.push('/store-dashboard');
              return;
            }
          }
        } catch (error) {
          console.error('Error checking user status:', error);
        }
      }
    };
    checkAuthAndRedirect();
  }, [history]);

  // Sample grocery categories
  const categories = [
    { id: 1, name: 'Fruits & Vegetables', icon: '🥬', color: '#4CAF50' },
    { id: 2, name: 'Meat & Seafood', icon: '🥩', color: '#F44336' },
    { id: 3, name: 'Dairy & Eggs', icon: '🥛', color: '#2196F3' },
    { id: 4, name: 'Bakery', icon: '🍞', color: '#FF9800' },
    { id: 5, name: 'Snacks', icon: '🍿', color: '#9C27B0' },
    { id: 6, name: 'Beverages', icon: '🥤', color: '#00BCD4' }
  ];

  // Sample featured products
  const featuredProducts = [
    {
      id: 1,
      name: 'Fresh Bananas',
      price: '₱120/kg',
      rating: 4.8,
      image: '/images/banana.jpg',
      store: 'FreshMart'
    },
    {
      id: 2,
      name: 'Whole Milk',
      price: '₱85/L',
      rating: 4.9,
      image: '/images/milk.jpg',
      store: 'DairyBest'
    },
    {
      id: 3,
      name: 'Fresh Bread',
      price: '₱45/loaf',
      rating: 4.7,
      image: '/images/bread.jpg',
      store: 'Golden Bakery'
    },
    {
      id: 4,
      name: 'Chicken Breast',
      price: '₱280/kg',
      rating: 4.6,
      image: '/images/chicken.jpg',
      store: 'MeatMaster'
    }
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>GroSho</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent id="main-content">
        {/* Hero Section */}
        <div className="hero-section">
          <h1>Fresh Groceries</h1>
          <h2>Delivered to Your Door</h2>
          <p>Shop from local stores and get fresh products delivered fast</p>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search for products, stores..."
            showClearButton="focus"
          />
        </div>

        {/* Categories */}
        <div className="section">
          <h3 className="section-title">Shop by Category</h3>
          <IonGrid>
            <IonRow>
              {categories.map((category) => (
                <IonCol size="4" key={category.id}>
                  <div className="category-card">
                    <div 
                      className="category-icon"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon}
                    </div>
                    <p className="category-name">{category.name}</p>
                  </div>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </div>

        {/* Featured Products */}
        <div className="section">
          <h3 className="section-title">Featured Products</h3>
          <div className="products-grid">
            {featuredProducts.map((product) => (
              <IonCard key={product.id} className="product-card">
                <div className="product-image">
                  <div className="product-placeholder">
                    🛒
                  </div>
                  <IonButton 
                    fill="clear" 
                    className="wishlist-btn"
                    size="small"
                  >
                    <IonIcon icon={heart} />
                  </IonButton>
                </div>
                
                <IonCardContent>
                  <div className="product-info">
                    <h4 className="product-name">{product.name}</h4>
                    <div className="product-rating">
                      <IonIcon icon={star} color="warning" />
                      <span>{product.rating}</span>
                    </div>
                    <p className="product-store">
                      <IonIcon icon={locationOutline} />
                      {product.store}
                    </p>
                    <div className="product-footer">
                      <span className="product-price">{product.price}</span>
                      <IonButton 
                        size="small" 
                        fill="solid" 
                        color="primary"
                        className="add-to-cart-btn"
                      >
                        <IonIcon icon={cartOutline} slot="start" />
                        Add
                      </IonButton>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        </div>

        {/* Nearby Stores */}
        <div className="section">
          <h3 className="section-title">Nearby Stores</h3>
          <div className="stores-list">
            <IonCard className="store-card">
              <IonCardContent>
                <div className="store-info">
                  <div className="store-header">
                    <h4>FreshMart Supermarket</h4>
                    <div className="store-rating">
                      <IonIcon icon={star} color="warning" />
                      <span>4.8</span>
                    </div>
                  </div>
                  <p className="store-details">
                    <IonIcon icon={locationOutline} />
                    0.5 km away • 15-20 min delivery
                  </p>
                  <div className="store-categories">
                    <span className="category-tag">Fruits</span>
                    <span className="category-tag">Vegetables</span>
                    <span className="category-tag">Dairy</span>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard className="store-card">
              <IonCardContent>
                <div className="store-info">
                  <div className="store-header">
                    <h4>Golden Bakery</h4>
                    <div className="store-rating">
                      <IonIcon icon={star} color="warning" />
                      <span>4.9</span>
                    </div>
                  </div>
                  <p className="store-details">
                    <IonIcon icon={locationOutline} />
                    0.8 km away • 20-25 min delivery
                  </p>
                  <div className="store-categories">
                    <span className="category-tag">Bread</span>
                    <span className="category-tag">Pastries</span>
                    <span className="category-tag">Cakes</span>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        </div>

        {/* Bottom Menu Bar */}
        <div className="bottom-bar">
          <button className="bottom-bar-btn">
            <IonIcon icon={storefrontOutline} className="shop-btn" />
          </button>
          <button className="bottom-bar-btn">
            <IonIcon icon={cartOutline} className="cart-btn" />
          </button>
          <IonMenuToggle menu="profile-menu">
            <button className="bottom-bar-btn" onClick={() => console.log('Profile button clicked')}>
              <IonIcon icon={personOutline} className="profile-btn" />
            </button>
          </IonMenuToggle>
        </div>
      </IonContent>

      {/* Profile Menu */}
      <ProfileMenu />
    </IonPage>
  );
};

export default Home;
