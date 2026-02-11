// =============================================================
// FILE: src/config/app-config.ts
// FINAL — Königs Massage Panel Config (TR)
// =============================================================

import packageJson from '../../package.json';

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: 'Königs Massage Panel',
  version: packageJson.version,
  copyright: `© ${currentYear}, Königs Massage.`,
  meta: {
    title: 'Königs Massage Panel - Yönetim Paneli',
    description:
      'Königs Massage yönetim paneli; sipariş, ürün, lokasyon, prim, bildirim ve rapor süreçlerini tek noktadan yönetmeniz için tasarlanmıştır.',
  },
} as const;
