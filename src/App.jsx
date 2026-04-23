import { useState, useRef, useEffect, lazy, Suspense } from 'react';
// ── Always-eager: tiny shell components (part of initial bundle) ────────────
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import CategoryCards from './components/CategoryCards';
import CurvedLoop from './components/CurvedLoop';
import ShopByCategory from './components/ShopByCategory';
import Footer from './components/Footer';
import CartOverlay from './components/CartOverlay';
import { authStore } from './services/api';
import { useToast, ToastContainer } from './components/Toast';
import { SkeletonProductGrid } from './components/SkeletonLoader';
import FeaturedProducts from './components/FeaturedProducts';
import BigShopCTA from './components/BigShopCTA';

// ── React.lazy: page-level code splitting (loaded on demand) ─────────────────
const AuthPage = lazy(() => import('./components/AuthPage'));
const ProductsPage = lazy(() => import('./components/ProductsPage'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const StaticPage = lazy(() => import('./components/StaticPage'));
const AdminLogin = lazy(() => import('./components/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const ProductDetailPage = lazy(() => import('./components/ProductDetailPage'));
const InvoicePage = lazy(() => import('./components/InvoicePage'));

const ADMIN_PATH = (import.meta.env.VITE_ADMIN_PATH || '/_bknst_a93f2d4_portal').trim();

const normalizePath = (path) => {
  if (!path) return '/';
  const normalized = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
  return normalized || '/';
};

export default function App() {
  const pathname = normalizePath(window.location.pathname);
  const adminPath = normalizePath(ADMIN_PATH);

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return <LegacyAdminRedirect targetPath={adminPath} />;
  }

  const isAdminRoute = pathname === adminPath || pathname.startsWith(`${adminPath}/`);

  return isAdminRoute ? <AdminApp /> : <StorefrontApp />;
}

function LegacyAdminRedirect({ targetPath }) {
  useEffect(() => {
    window.location.replace(targetPath);
  }, [targetPath]);

  return null;
}

function AdminApp() {
  const storedUser = authStore.getUser();
  const [adminUser, setAdminUser] = useState(storedUser?.role === 'admin' ? storedUser : null);

  const fallback = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 48, height: 48, border: '3px solid #C9A97A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  if (!adminUser) {
    return <Suspense fallback={fallback}><AdminLogin onSuccess={setAdminUser} /></Suspense>;
  }

  return <Suspense fallback={fallback}><AdminDashboard adminUser={adminUser} onLogout={() => setAdminUser(null)} /></Suspense>;
}

function StorefrontApp() {

  const [user, setUser] = useState(authStore.getUser());
  const { toasts, toast } = useToast();
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
  const [invoiceOrderId, setInvoiceOrderId] = useState(null);

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

    if (invoiceOrderId) {
      return (
        <InvoicePage
          orderId={invoiceOrderId}
          onBack={() => {
            setInvoiceOrderId(null);
            setShowProfile(true);
          }}
        />
      );
    }

    if (showProfile && user) {
      return <ProfilePage user={user} onLogout={handleLogout} onBack={handleBack} onViewInvoice={(id) => { setInvoiceOrderId(id); setShowProfile(false); }} />;
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
            onAddToCart={addToCart}
            onCartOpen={() => setCartOpen(true)}
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

        <FeaturedProducts 
          title="Premium Baking Inventory" 
          category="all"
          onProductClick={handleProductSelect}
          onAddToCart={addToCart}
        />

        <FeaturedProducts 
          title="Must-Have Tools" 
          category="all"
          page={2}
          onProductClick={handleProductSelect}
          onAddToCart={addToCart}
        />

        <BigShopCTA onClick={() => handleNavClick('Shop')} />
      </main>
    );
  };

  return (
    <div className="app">
      {/* Skip-to-main for keyboard/screen reader users */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {!authOpen && (
        <Header
          user={user}
          onAuthOpen={handleUserIconClick}
          onSearchClick={() => {
            setCurrentPage('products');
            setSelectedCategory('all');
            window.scrollTo(0, 0);
          }}
          onNavClick={handleNavClick}
          onCartClick={() => setCartOpen(true)}
        />
      )}

      <Suspense
        fallback={
          <main id="main-content" style={{ paddingTop: 80, minHeight: '60vh' }}>
            <SkeletonProductGrid count={8} />
          </main>
        }
      >
        <main id="main-content">
          {renderContent()}
        </main>
      </Suspense>

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

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onClose={toast.dismiss} />
    </div>
  );
}

