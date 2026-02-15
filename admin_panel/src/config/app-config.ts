// =============================================================
// FILE: src/config/app-config.ts
// Admin Panel Config — DB'den gelen branding verileri için fallback
// =============================================================

import packageJson from '../../package.json';

const currentYear = new Date().getFullYear();

export type AdminBrandingConfig = {
  app_name: string;
  app_copyright: string;
  html_lang: string;
  theme_color: string;
  favicon_16: string;
  favicon_32: string;
  apple_touch_icon: string;
  meta: {
    title: string;
    description: string;
    og_url: string;
    og_title: string;
    og_description: string;
    og_image: string;
    twitter_card: string;
  };
};

export const DEFAULT_BRANDING: AdminBrandingConfig = {
  app_name: 'Königs Massage Panel',
  app_copyright: 'Königs Massage',
  html_lang: 'de',
  theme_color: '#FDFCFB',
  favicon_16: '/favicon/favicon-16.svg',
  favicon_32: '/favicon/favicon-32.svg',
  apple_touch_icon: '/favicon/apple-touch-icon.svg',
  meta: {
    title: 'König Energetik - Energetische Massage Berlin | Anastasia König',
    description:
      'König Energetik: Ganzheitliche energetische Massage in Berlin. Anastasia König bietet mobile Körperarbeit bei Ihnen zu Hause. Heilende Berührung mit Herz.',
    og_url: 'https://koenig-energetik.de/',
    og_title: 'König Energetik - Energetische Massage Berlin',
    og_description:
      'Ganzheitliche energetische Massage in Berlin. Heilende Berührung mit Herz. Mobile Körperarbeit von Anastasia König.',
    og_image: '/logo/koenig-energetik-icon.svg',
    twitter_card: 'summary_large_image',
  },
};

export const APP_CONFIG = {
  name: DEFAULT_BRANDING.app_name,
  version: packageJson.version,
  copyright: `© ${currentYear}, ${DEFAULT_BRANDING.app_copyright}.`,
  meta: {
    title: DEFAULT_BRANDING.meta.title,
    description: DEFAULT_BRANDING.meta.description,
  },
  branding: DEFAULT_BRANDING,
} as const;
