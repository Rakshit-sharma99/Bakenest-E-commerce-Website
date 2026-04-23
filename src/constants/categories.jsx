export const SHOP_CATEGORIES = [
  {
    id: 'mixing-bowls',
    label: 'Mixing Bowls',
    tagline: 'Every great bake starts here',
    accent: '#C9956A',
    bg: 'linear-gradient(135deg, #f5e2c8 0%, #e8c89a 100%)',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <ellipse cx="32" cy="38" rx="24" ry="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M8 38 C8 52 56 52 56 38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M18 28 Q20 20 32 18 Q44 20 46 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M12 32 Q32 24 52 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 3"/>
      </svg>
    ),
  },
  {
    id: 'baking-pans',
    label: 'Baking Pans',
    tagline: 'Shape your sweet creations',
    accent: '#A0735C',
    bg: 'linear-gradient(135deg, #eddcc6 0%, #d4a87a 100%)',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <rect x="8" y="20" width="48" height="28" rx="4" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M16 20 L16 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M48 20 L48 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="16" y="28" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2"/>
        <rect x="28" y="28" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2"/>
        <rect x="40" y="28" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'measuring-tools',
    label: 'Measuring Tools',
    tagline: 'Precision in every pinch',
    accent: '#8B6348',
    bg: 'linear-gradient(135deg, #f0dfc5 0%, #c9a07a 100%)',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path d="M12 50 L12 18 Q12 14 16 14 L28 14 Q32 14 32 18 L32 50 Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 26 L20 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 34 L24 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 42 L18 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M38 50 L38 28 Q38 24 42 24 L50 24 Q54 24 54 28 L54 50 Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M38 36 L46 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M38 44 L50 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'rolling-pins',
    label: 'Rolling Pins',
    tagline: 'Roll to perfection, every time',
    accent: '#B07D55',
    bg: 'linear-gradient(135deg, #f2e0c4 0%, #dbb884 100%)',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <ellipse cx="10" cy="32" rx="6" ry="10" stroke="currentColor" strokeWidth="2.5"/>
        <ellipse cx="54" cy="32" rx="6" ry="10" stroke="currentColor" strokeWidth="2.5"/>
        <rect x="16" y="24" width="32" height="16" rx="8" stroke="currentColor" strokeWidth="2.5"/>
        <line x1="16" y1="32" x2="48" y2="32" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3"/>
      </svg>
    ),
  },
  {
    id: 'whisks-spatulas',
    label: 'Whisks & Spatulas',
    tagline: 'Fold, whisk and mix with ease',
    accent: '#9A6040',
    bg: 'linear-gradient(135deg, #f5e5cc 0%, #cf9f72 100%)',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path d="M20 52 L20 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <ellipse cx="20" cy="22" rx="8" ry="6" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M16 22 Q20 14 24 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M44 52 L44 34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="38" y="18" width="12" height="16" rx="6" stroke="currentColor" strokeWidth="2.5"/>
      </svg>
    ),
  },
  {
    id: 'decorating',
    label: 'Decorating Tools',
    tagline: 'Make every cake a masterpiece',
    accent: '#C47E50',
    bg: 'linear-gradient(135deg, #faead4 0%, #e0a86c 100%)',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path d="M32 8 L38 28 L58 28 L42 40 L48 60 L32 48 L16 60 L22 40 L6 28 L26 28 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
        <circle cx="32" cy="34" r="6" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'timers-scales',
    label: 'Timers & Scales',
    tagline: 'Every gram and second counts',
    accent: '#8C6040',
    bg: 'linear-gradient(135deg, #eddcc8 0%, #c9996a 100%)',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <rect x="10" y="34" width="44" height="22" rx="4" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M22 34 L22 30 Q22 24 32 24 Q42 24 42 30 L42 34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M32 24 L32 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="32" cy="46" r="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M20 46 L28 46" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M36 46 L44 46" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'storage',
    label: 'Storage & Jars',
    tagline: 'Fresh ingredients, beautiful spaces',
    accent: '#B8895A',
    bg: 'linear-gradient(135deg, #f0dfc8 0%, #d4a478 100%)',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path d="M18 16 L46 16 L46 52 Q46 56 42 56 L22 56 Q18 56 18 52 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M14 12 L50 12 Q52 12 52 16 L12 16 Q12 12 14 12 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M26 12 L26 8 L38 8 L38 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18 30 L46 30" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2"/>
      </svg>
    ),
  },
];
