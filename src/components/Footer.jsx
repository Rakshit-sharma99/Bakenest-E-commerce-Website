import './Footer.css';

const SECTIONS = [
  {
    title: 'Shop',
    links: ['All Products', 'New Arrivals', 'Best Sellers', 'Gift Sets']
  },
  {
    title: 'Support',
    links: ['FAQs', 'Shipping', 'Returns', 'Contact Us']
  },
  {
    title: 'Company',
    links: ['Our Story', 'Careers', 'Press', 'Blog']
  }
];

export default function Footer({ onNavClick }) {
  const handleClick = (e, link) => {
    e.preventDefault();
    if (onNavClick) onNavClick(link);
  };

  return (
    <footer className="footer" role="contentinfo">
      <div className="footerInner">
        <div className="footerBrand">
          <div className="footerLogo">
            BAKEHAUS
            <span className="footerLogoAccent">EST. 2026</span>
          </div>
          <p className="footerTagline">
            Crafting the finest baking tools for every kitchen. Quality you can feel, results you can taste.
          </p>
          <div className="footerSocial">
            <a href="#" className="footerSocialLink" aria-label="Instagram">
              <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" /></svg>
            </a>
            <a href="#" className="footerSocialLink" aria-label="Facebook">
              <svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
            </a>
          </div>
        </div>

        {SECTIONS.map((sec) => (
          <div className="footerColumn" key={sec.title}>
            <h4 className="footerColumnTitle">{sec.title}</h4>
            {sec.links.map((link) => (
              <a key={link} href="#" className="footerLink" onClick={(e) => handleClick(e, link)}>
                {link}
              </a>
            ))}
          </div>
        ))}

        <div className="footerDivider" aria-hidden="true" />

        <div className="footerBottom">
          <span>&copy; 2026 BakeHaus. All rights reserved.</span>
          <div className="footerBottomLinks">
            <a href="#" className="footerBottomLink" onClick={(e) => handleClick(e, 'Privacy Policy')}>Privacy Policy</a>
            <a href="#" className="footerBottomLink" onClick={(e) => handleClick(e, 'Terms of Service')}>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
