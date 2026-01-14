// src/components/layout/admin/adminNav.ts
import type { ActiveTab } from '@/layout/admin/AdminLayout';

/**
 * Admin tab -> route eşlemesi.
 * Tüm admin navigasyonu buraya bakmalı.
 */
export const ADMIN_TAB_ROUTES: Record<ActiveTab, string> = {
  dashboard: '/admin',

  site_settings: '/admin/site-settings',
  custom_pages: '/admin/custompage',
  services: '/admin/services',

  slider: '/admin/slider',
  availability: '/admin/availability',
  resources: '/admin/resources',
  bookings: '/admin/bookings',

  faqs: '/admin/faqs',
  contacts: '/admin/contacts',

  email_templates: '/admin/email-templates',

  users: '/admin/users',
  db: '/admin/db',

  reviews: '/admin/reviews',

  menuitem: '/admin/menuitem',
  footer_sections: '/admin/footer-sections',
  storage: '/admin/storage',
};

/**
 * Path'in admin alanına ait olup olmadığını tespit eder.
 * Burada Next.js `router.pathname` pattern'leri kullanıyoruz:
 *  - "/admin"
 *  - "/admin/..."
 */
export function isAdminPath(path: string): boolean {
  const p = String(path || '/');
  return p === '/admin' || p.startsWith('/admin/');
}

/**
 * "/admin/products/123" gibi alt rotalarda aktif tab'ı bulur.
 * En uzun prefix’i seçerek yanlış eşleşmeleri azaltır.
 */
export function pathToTab(pathname: string): ActiveTab {
  const p = String(pathname || '/');

  // exact dashboard
  if (p === '/admin' || p === '/admin/') return 'dashboard';

  let best: { tab: ActiveTab; len: number } | null = null;

  for (const [tab, base] of Object.entries(ADMIN_TAB_ROUTES) as Array<[ActiveTab, string]>) {
    if (tab === 'dashboard') continue;

    if (p === base || p.startsWith(base + '/')) {
      const len = base.length;
      if (!best || len > best.len) best = { tab, len };
    }
  }

  return best?.tab ?? 'dashboard';
}

/**
 * Tab -> temel route çevirimi.
 */
export function tabToPath(tab: ActiveTab): string {
  return ADMIN_TAB_ROUTES[tab] ?? '/admin';
}
