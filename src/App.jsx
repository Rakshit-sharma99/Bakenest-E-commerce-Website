import { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import CategoryCards from './components/CategoryCards';
import CurvedLoop from './components/CurvedLoop';
import ShopByCategory from './components/ShopByCategory';
import Footer from './components/Footer';
import AuthPage from './components/AuthPage';
import ProductsPage from './components/ProductsPage';
import ProfilePage from './components/ProfilePage';
import StaticPage from './components/StaticPage';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import CartOverlay from './components/CartOverlay';
import ProductDetailPage from './components/ProductDetailPage';
import { authStore } from './services/api';

export default function App() {
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  return isAdminRoute ? <AdminApp /> : <StorefrontApp />;
}

function AdminApp() {
  const isAdminRoute = window.location.pathname.startsWith('/admin');
  const storedUser = authStore.getUser();
  const [adminUser, setAdminUser] = useState(storedUser?.role === 'admin' ? storedUser : null);

  if (isAdminRoute) {
    if (!adminUser) {
      return <AdminLogin onSuccess={setAdminUser} />;
    }

    return <AdminDashboard adminUser={adminUser} onLogout={() => setAdminUser(null)} />;
  }

  return null;
}

function StorefrontApp() {

  const [user, setUser] = useState(authStore.getUser()); // { name, email }
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('pwa_selectedCategory')) || null; } catch { return null; }
  });
  const [activeStaticPage, setActiveStaticPage] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('pwa_activeStaticPage')) || null; } catch { return null; }
  });
  const [showProfile, setShowProfile] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('pwa_showProfile')) || false; } catch { return false; }
  });
  const [selectedProduct, setSelectedProduct] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('pwa_selectedProduct')) || null; } catch { return null; }
  });
  
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [sourceSection, setSourceSection] = useState(null);
  const shopCatRef = useRef(null);

  // Sync state to avoid losing placement on refresh
  useEffect(() => {
    sessionStorage.setItem('pwa_selectedCategory', JSON.stringify(selectedCategory));
    sessionStorage.setItem('pwa_activeStaticPage', JSON.stringify(activeStaticPage));
    sessionStorage.setItem('pwa_showProfile', JSON.stringify(showProfile));
    sessionStorage.setItem('pwa_selectedProduct', JSON.stringify(selectedProduct));
  }, [selectedCategory, activeStaticPage, showProfile, selectedProduct]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(item => (item._id || item.id) === (product._id || product.id));
      if (existing) {
        return prev.map(item => (item._id || item.id) === (product._id || product.id)
          ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (product) => {
    setCart(prev => prev.filter(item => (item._id || item.id) !== (product._id || product.id)));
  };

  const updateCartQuantity = (product, delta) => {
    setCart(prev => prev.map(item => {
      if ((item._id || item.id) === (product._id || product.id)) {
        const newQ = item.quantity + delta;
        return { ...item, quantity: Math.max(1, newQ) };
      }
      return item;
    }));
  };

  /* ── VIEW HANDLERS ── */
  
  const resetToHome = () => {
    setSelectedCategory(null);
    setActiveStaticPage(null);
    setShowProfile(false);
    setAuthOpen(false);
    setSelectedProduct(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategorySelect = (category, source = 'categories') => {
    setSourceSection(source);
    setActiveStaticPage(null);
    setShowProfile(false);
    setSelectedProduct(null);
    setSelectedCategory(category);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleProductSelect = (product) => {
    setSelectedCategory(null);
    setActiveStaticPage(null);
    setShowProfile(false);
    setSelectedProduct(product);
  };

  const handleBack = () => {
    if (selectedProduct) {
      setSelectedProduct(null);
      return; 
      // This will fall back to whichever state was active previously, 
      // but depending on logic we might want to default to home or previous list
      // For immediate simplicity: Back from PDP -> Products List or Home. 
    }

    if (activeStaticPage || showProfile || selectedCategory) {
      const prevSource = sourceSection;
      setSelectedCategory(null);
      setActiveStaticPage(null);
      setShowProfile(false);

      setTimeout(() => {
        let targetId = 'home';
        if (prevSource === 'collections') targetId = 'categories';
        else if (prevSource === 'categories') targetId = 'shop-by-category';
        
        const el = document.getElementById(targetId);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  };

  const handleNavClick = (item) => {
    setSelectedProduct(null);
    if (item === 'Shop' || item === 'All Products') {
      handleCategorySelect({ id: 'all', label: 'All Products' }, 'hero');
    } else if (item === 'Categories') {
      resetToHome();
      setTimeout(() => {
        document.getElementById('shop-by-category')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (item === 'Home') {
      resetToHome();
    } else {
      setSelectedCategory(null);
      setShowProfile(false);
      setActiveStaticPage(item);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setAuthOpen(false);
    if (!cartOpen) setShowProfile(true);
  };

  const handleUserIconClick = () => {
    if (user) {
      setSelectedCategory(null);
      setActiveStaticPage(null);
      setShowProfile(prev => !prev);
    } else {
      setAuthOpen(true);
    }
  };

  const handleLogout = () => {
    authStore.clearSession();
    setUser(null);
    setShowProfile(false);
    resetToHome();
  };

  /* ── RENDER LOGIC ── */

  const renderContent = () => {
    if (authOpen) {
      return <AuthPage onClose={() => setAuthOpen(false)} onAuthSuccess={handleAuthSuccess} />;
    }

    if (showProfile && user) {
      return <ProfilePage user={user} onLogout={handleLogout} onBack={handleBack} />;
    }

    if (activeStaticPage) {
      return <StaticPage type={activeStaticPage} onBack={handleBack} onNavClick={handleNavClick} />;
    }

    if (selectedProduct) {
      return (
        <div style={{ paddingTop: '80px' }}>
          <ProductDetailPage 
            productId={selectedProduct._id || selectedProduct.id} 
            initialProduct={selectedProduct}
            onBack={handleBack}
            user={user}
            onProductClick={handleProductSelect}
          />
        </div>
      );
    }

    if (selectedCategory) {
      return (
        <div style={{ paddingTop: '80px' }}>
          <ProductsPage 
            category={selectedCategory} 
            onBack={handleBack} 
            onAddToCart={addToCart} 
            onProductClick={handleProductSelect}
          />
        </div>
      );
    }

    return (
      <main>
        <HeroSection onShopClick={() => handleNavClick('Shop')} />
        <CategoryCards onSelect={(cat) => handleCategorySelect(cat, 'collections')} />
        
        <CurvedLoop 
          marqueeText="Get ✦ all ✦ baking ✦ equipment ✦ from ✦ us ✦ " 
          speed={2} 
          curveAmount={400} 
        />

        <ShopByCategory ref={shopCatRef} onSelect={(cat) => handleCategorySelect(cat, 'categories')} />
      </main>
    );
  };

  return (
    <div className="app">
      {!authOpen && (
        <Header 
          user={user}
          onAuthOpen={handleUserIconClick} 
          onSearchClick={() => {
            if (selectedCategory || activeStaticPage || showProfile) resetToHome();
            setTimeout(() => shopCatRef.current?.focusSearch(), 200);
          }} 
          onNavClick={handleNavClick} 
          onCartClick={() => setCartOpen(true)}
        />
      )}

      {renderContent()}

      {!authOpen && !showProfile && !activeStaticPage && <Footer onNavClick={handleNavClick} />}

      {cartOpen && (
        <CartOverlay
          cart={cart}
          onClose={(success) => {
            setCartOpen(false);
            if (success === true) setCart([]);
          }}
          onRemoveItem={removeFromCart}
          onUpdateQuantity={updateCartQuantity}
          user={user}
          onAuthRequest={() => setAuthOpen(true)}
        />
      )}
    </div>
  );
}

