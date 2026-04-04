import './StaticPage.css';

const CONTENTS = {
  'Privacy Policy': {
    title: 'Privacy Policy',
    lastUpdated: 'February 15, 2024',
    body: `
      At BakeHaus, we take your privacy seriously. This policy describes how we collect, use, and share information about you.
      
      ## Information We Collect
      - **Account Information:** Name, email, and password when you create an account.
      - **Order Information:** Items purchased, delivery address, and payment details.
      - **Browsing Data:** Cookies and IP addresses to improve site performance.
      
      ## How We Use Your Data
      We use your information to process orders, communicate about shipments, and personalize your shopping experience.
      
      ## Data Sharing
      We do not sell your personal data. We only share info with necessary partners (like couriers for shipping).`
  },
  'Terms of Service': {
    title: 'Terms of Service',
    lastUpdated: 'March 1, 2024',
    body: `
      Welcome to BakeHaus. By using our website, you agree to the following terms.
      
      ## Use of Site
      You must be at least 18 years old to make a purchase.
      
      ## Accuracy of Information
      We strive for accuracy but do not warrant that product descriptions are 100% error-free.
      
      ## Limitation of Liability
      BakeHaus shall not be liable for any indirect damages resulting from the use of our products.`
  },
  'Shipping': {
    title: 'Shipping & Delivery',
    lastUpdated: 'Ongoing',
    body: `
      BakeHaus ships to over 50 countries worldwide.
      
      ## Processing Times
      Orders are processed within 1-2 business days.
      
      ## Shipping Methods
      - **Standard Shipping:** 5-7 business days ($5.00 or free on orders over $50)
      - **Express Shipping:** 2-3 business days ($12.00)
      
      ## Tracking
      Once shipped, you will receive a tracking link via email.`
  },
  'Returns': {
    title: 'Returns & Refunds',
    lastUpdated: 'Ongoing',
    body: `
      Not satisfied with your tools? We're here to help.
      
      ## 30-Day Window
      You have 30 days from the delivery date to return any unused items in their original packaging.
      
      ## How to Return
      Contact support@bakehaus.com with your order number to start a return.
      
      ## Refunds
      Refunds are processed back to the original payment method within 5-10 business days.`
  },
  'Our Story': {
    title: 'Our Story',
    lastUpdated: 'Est. 2024',
    body: `
      BakeHaus was born out of a simple need: professional-grade tools for the home baker.
      
      Founded in 2024, our mission is to empower every kitchen explorer with precision-engineered equipment that's as beautiful as it is functional.
      
      We believe that baking is a science, an art, and most importantly, a joy. Our curated selection of tools is designed to make every fold, whisk, and pour a perfect moment.`
  },
  'Contact Us': {
    title: 'Contact Us',
    lastUpdated: '24/7 Support',
    body: `
      Have questions or feedback? We'd love to hear from you.
      
      ## Support Email
      support@bakehaus.com
      
      ## Press Inquiries
      press@bakehaus.com
      
      ## Headquarters
      123 Baker St, London, NW1 6XE, UK
      
      Our support team typically responds within 24 hours.`
  }
};

export default function StaticPage({ type, onBack, onNavClick }) {
  const content = CONTENTS[type] || { 
    title: type, 
    lastUpdated: 'Recently', 
    body: `Coming Soon. We are working on the content for ${type}. Check back later!` 
  };

  const handleLinkClick = (key) => {
    if (onNavClick) {
      onNavClick(key);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="staticPage">
      <div className="staticHeaderBox">
        <button className="staticBack" onClick={onBack}>← Back</button>
        <div className="staticHeaderContent">
          <h1 className="staticTitle">{content.title}</h1>
          <p className="staticMeta">Last Updated: {content.lastUpdated}</p>
        </div>
      </div>

      <div className="staticBodyWrap">
        <div className="staticBody">
          {content.body.split('\n').map((line, i) => {
            if (line.startsWith('##')) {
              return <h2 key={i}>{line.replace('##', '').trim()}</h2>;
            }
            if (line.startsWith('-')) {
              return <li key={i}>{line.replace('-', '').trim()}</li>;
            }
            if (line.trim()) {
              return <p key={i}>{line.trim()}</p>;
            }
            return <br key={i} />;
          })}
        </div>
        
        <div className="staticSideNav">
          <h3>Quick Links</h3>
          {Object.keys(CONTENTS).map(key => (
            <button 
              key={key} 
              className={`sideNavLink ${key === type ? 'active' : ''}`}
              onClick={() => handleLinkClick(key)}
            >
              {key}
            </button>
          ))}
          {/* Add a few extra links that are in footer but not as primary documentation */}
          <button className="sideNavLink" onClick={() => handleLinkClick('FAQs')}>FAQs</button>
          <button className="sideNavLink" onClick={() => handleLinkClick('Blog')}>Blog</button>
        </div>
      </div>
    </div>
  );
}
