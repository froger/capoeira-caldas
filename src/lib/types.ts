export type Locale = 'pt' | 'en';

export interface SiteConfig {
  name: string;
  tagline: string;
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
    tiktok: string;
  };
  forms: {
    newsletter_action: string;
    contact_formspree: string;
  };
  positioning: {
    category: string;
    headline: string;
    subhead: string;
    primary_cta: string;
    navbar_cta: string;
    youtube_url: string;
    value_themes: { id: string; title: string; description: string }[];
    anti_persona_hint: string;
    pov: string[];
  };
  stats: { label: string; value: number }[];
}

export interface ScheduleClass {
  group: string;
  day: string;
  time: string;
  level: string;
  instructor: string;
  location: string;
}

export interface Instructor {
  id: string;
  name: string;
  title: string;
  graduation: string;
  bio: string;
  bio_short: string;
  photo: string;
  instagram?: string;
  youtube?: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  level: string;
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
  type: 'image' | 'video';
  src: string;
  thumbnail?: string;
  title: string;
  category: string;
  youtube_id?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ClassProgram {
  id: string;
  badge: string;
  title: string;
  age_range: string;
  description: string;
  pillars: { icon: string; label: string }[];
  schedule_note: string;
  equipment: string[];
}

export interface NavItem {
  key: string;
  href: string;
}
