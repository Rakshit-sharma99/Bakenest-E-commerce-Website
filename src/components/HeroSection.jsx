import './HeroSection.css';
import bgImage from '../assets/images/abcdefg.png';

const CheckIcon = () => (
  <svg
    className="checkIcon"
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" stroke="#C9956A" strokeWidth="2" />
    <path
      d="M8 12l2.5 3L16 9"
      stroke="#C9956A"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function HeroSection({ onShopClick }) {
  const handleClick = (e) => {
    e.preventDefault();
    if (onShopClick) {
      onShopClick();
    }
  };

  return (
    <section
      className="hero"
      id="home"
      aria-label="Hero section"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Subtle left-side scrim so text stays readable */}
      <div className="heroScrim" aria-hidden="true" />

      {/* Bottom wave divider */}
      <div className="heroWave" aria-hidden="true">
        <svg viewBox="0 0 1440 90" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,52 C80,42 160,68 240,60 C320,52 400,30 480,38
               C560,46 640,70 720,62 C800,54 880,32 960,40
               C1040,48 1120,70 1200,62 C1280,54 1360,40 1440,48
               L1440,90 L0,90 Z"
            fill="#F5E6D3"
          />
        </svg>
      </div>

      {/* Main content — left column only, image lives in the bg */}
      <div className="heroInner">
        <div className="heroLeft">

          {/* Eyebrow */}
          <p className="heroEyebrow">
            <span className="star" aria-hidden="true">✦</span>
            <span>WELCOME TO OUR</span>
            <span className="star" aria-hidden="true">✦</span>
          </p>

          {/* Main heading */}
          <h1 className="heroHeading">
            BAKING<br />ESSENTIALS
          </h1>

          {/* Script line */}
          <p className="heroScript">
            <span className="star" aria-hidden="true">✦</span>
            <em>Tools for Every Baker</em>
            <span className="star" aria-hidden="true">✦</span>
          </p>

          {/* Body copy */}
          <p className="heroPara">
            Discover high-quality baking tools and essentials<br />
            to bring your creations to life.
          </p>

          {/* CTA */}
          <button onClick={handleClick} className="heroCta" id="cta-shop-collection" style={{ border: 'none', cursor: 'pointer' }}>
            Shop Collection <span className="ctaArrow">›</span>
          </button>

          {/* Feature checklist */}
          <ul className="heroFeatures" aria-label="Key features">
            <li><CheckIcon /> Premium Quality</li>
            <li><CheckIcon /> Must-Have Tools</li>
            <li><CheckIcon /> Exclusive Selections</li>
          </ul>

        </div>
      </div>
    </section>
  );
}
