import { useState, useRef } from 'react';
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

export default function App() {
  const [user, setUser] = useState(null); // { name, email }
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeStaticPage, setActiveStaticPage] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  
  const [sourceSection, setSourceSection] = useState(null);
  const shopCatRef = useRef(null);

  /* ── VIEW HANDLERS ── */
  
  const resetToHome = () => {
    setSelectedCategory(null);
    setActiveStaticPage(null);
    setShowProfile(false);
    setAuthOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategorySelect = (category, source = 'categories') => {
    setSourceSection(source);
    setActiveStaticPage(null);
    setShowProfile(false);
    setSelectedCategory(category);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleBack = () => {
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
      // Handle Privacy, Terms, Shipping, Returns, etc. via common handler
      setSelectedCategory(null);
      setShowProfile(false);
      setActiveStaticPage(item);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setAuthOpen(false);
    setShowProfile(true);
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

    if (selectedCategory) {
      return (
        <div style={{ paddingTop: '80px' }}>
          <ProductsPage category={selectedCategory} onBack={handleBack} />
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
      {/* Header always present unless in full-screen Auth */}
      {!authOpen && (
        <Header 
          user={user}
          onAuthOpen={handleUserIconClick} 
          onSearchClick={() => {
            if (selectedCategory || activeStaticPage || showProfile) resetToHome();
            setTimeout(() => shopCatRef.current?.focusSearch(), 200);
          }} 
          onNavClick={handleNavClick} 
        />
      )}

      {renderContent()}

      {!authOpen && !showProfile && !activeStaticPage && <Footer onNavClick={handleNavClick} />}
    </div>
  );
}
