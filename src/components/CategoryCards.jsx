import Card from './Card';
import './CategoryCards.css';

import cardPremiumTools from '../assets/images/card-premium-tools.png';
import cardBakersFavorites from '../assets/images/card-bakers-favorites.png';
import cardEverythingNeed from '../assets/images/card-everything-need.png';

const CATEGORIES = [
  {
    id: 'premium-tools',
    title: 'Premium Tools',
    description: 'Durable, reliable, and made to last.',
    image: cardPremiumTools,
    alt: 'Stainless steel measuring cups and spoons arranged on beige linen',
  },
  {
    id: 'bakers-favorites',
    title: "Baker's Favorites",
    description: 'Top-rated picks loved by bakers.',
    image: cardBakersFavorites,
    alt: 'Cream stand mixer on warm neutral background',
  },
  {
    id: 'everything-need',
    title: 'Everything You Need',
    description: "From prep to perfect — we've got you.",
    image: cardEverythingNeed,
    alt: 'Muffin tin, measuring cups, whisk, and pastry brush on beige background',
  },
];

export default function CategoryCards({ onSelect }) {
  return (
    <section className="categories" id="categories" aria-label="Product categories">
      <div className="categoriesInner">
        <div className="categoriesHeader">
          <div className="categoriesTag">
            <span className="categoriesTagLine" aria-hidden="true" />
            Our Collections
            <span className="categoriesTagLine" aria-hidden="true" />
          </div>
          <h2 className="categoriesTitle">Curated Categories</h2>
          <p className="categoriesSubtitle">Handpicked for You</p>
        </div>

        <div className="categoriesGrid">
          {CATEGORIES.map((category, index) => (
            <Card
              key={category.id}
              title={category.title}
              description={category.description}
              image={category.image}
              alt={category.alt}
              index={index}
              onClick={() => onSelect({ id: category.id, label: category.title })}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
