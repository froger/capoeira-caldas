export type Locale = 'pt' | 'en';

export interface SiteConfig {
  name: string;
  description: string;
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    city: string;
    map_embed_url: string;
  };
  social: {
    instagram: string;
    youtube: string;
    facebook: string;
    x: string;
  };
  positioning: {
    primary_cta: string;
    navbar_cta: string;
    value_themes: { id: string; title: string; description: string; image?: string }[];
  };
}

export interface ScheduleClass {
  day: string;
  time: string;
  level: string;
  instructor: string;
  location: string;
}

export interface Instructor {
  id: string;
  name: string;
  graduation?: string;
  bio: string;
  bio_short: string;
  photo: string;
  instagram?: string;
  youtube?: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  level?: string;
  rating: number;
  avatar: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

export interface GalleryItem {
  id: string;
  src: string;
  title: string;
  price: string;
  images: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export type PricingAudience = 'kids' | 'adult';

export interface ClassProgram {
  id: string;
  badge: string;
  title: string;
  age_range: string;
  description: string;
  image: string;
  path: string;
  registration_url?: string;
  pillars: { icon: string; label: string }[];
  schedule_note: string;
  equipment: string[];
}
