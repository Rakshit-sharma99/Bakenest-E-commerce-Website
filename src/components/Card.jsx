import useIntersectionObserver from '../hooks/useIntersectionObserver';
import './Card.css';

const ROTATION_CLASSES = ['rotateLeft', 'rotateNone', 'rotateRight'];

export default function Card({ title, description, image, alt, index = 0, onClick }) {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.2 });
  const rotationClass = ROTATION_CLASSES[index % ROTATION_CLASSES.length];

  return (
    <article
      ref={ref}
      className={`card ${rotationClass} cardFadeIn ${isVisible ? 'cardVisible' : ''}`}
      style={{ transitionDelay: `${index * 0.15}s` }}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      tabIndex={0}
      role="button"
      aria-label={`View ${title} category products`}
      id={`card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="cardImageWrapper">
        <img
          src={image}
          alt={alt}
          className="cardImage"
          loading="lazy"
          width="400"
          height="300"
        />
        <div className="cardImageOverlay" aria-hidden="true" />
      </div>
      <div className="cardContent">
        <div className="cardDivider" aria-hidden="true" />
        <h3 className="cardTitle">{title}</h3>
        <p className="cardDescription">{description}</p>
      </div>
    </article>
  );
}
