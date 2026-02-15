// =============================================================
// FILE: src/navigation/sidebar/sidebar-items.ts
// FINAL — GuezelWebDesign — Sidebar items (labels are dynamic via site_settings.ui_admin)
// - Dashboard base: /admin/dashboard
// - Admin pages: /admin/...  (route group "(admin)" URL'e dahil olmaz)
// =============================================================

import {
  BarChart,
  Bell,
  Bot,
  Briefcase,
  Calendar,
  Clock,
  Contact2,
  Database,
  FileSearch,
  FileText,
  HardDrive,
  HelpCircle,
  Images,
  LayoutDashboard,
  Mail,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquare,
  Newspaper,
  Package,
  Receipt,
  Send,
  Settings,
  Shield,
  Star,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { TranslateFn } from '@/i18n';

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export type AdminNavItemKey =
  | 'dashboard'
  | 'site_settings'
  | 'custom_pages'
  | 'services'
  | 'sliders'
  | 'menu_items'
  | 'footer_sections'
  | 'faqs'
  | 'contacts'
  | 'reviews'
  | 'bookings'
  | 'mail'
  | 'users'
  | 'email_templates'
  | 'notifications'
  | 'storage'
  | 'db'
  | 'audit'
  | 'availability'
  | 'reports'
  | 'telegram'
  | 'chat';

export type AdminNavGroupKey = 'general' | 'content' | 'marketing' | 'communication' | 'system';

export type AdminNavConfigItem = {
  key: AdminNavItemKey;
  url: string;
  icon?: LucideIcon;
};

export type AdminNavConfigGroup = {
  id: number;
  key: AdminNavGroupKey;
  items: AdminNavConfigItem[];
};

export const adminNavConfig: AdminNavConfigGroup[] = [
  {
    id: 1,
    key: 'general',
    items: [{ key: 'dashboard', url: '/admin/dashboard', icon: LayoutDashboard }],
  },
  {
    id: 2,
    key: 'content',
    items: [
      { key: 'site_settings', url: '/admin/site-settings', icon: Settings },
      { key: 'custom_pages', url: '/admin/custompage', icon: FileText },
      { key: 'services', url: '/admin/services', icon: Wrench },
      { key: 'sliders', url: '/admin/slider', icon: Images },
      { key: 'menu_items', url: '/admin/menuitem', icon: Menu },
      { key: 'footer_sections', url: '/admin/footer-sections', icon: FileText },
      { key: 'faqs', url: '/admin/faqs', icon: HelpCircle },
    ],
  },
  {
    id: 4,
    key: 'communication',
    items: [
      { key: 'contacts', url: '/admin/contacts', icon: Contact2 },
      { key: 'reviews', url: '/admin/reviews', icon: MessageSquare },
      { key: 'bookings', url: '/admin/bookings', icon: Calendar },
      { key: 'availability', url: '/admin/availability', icon: Clock },
      { key: 'mail', url: '/admin/mail', icon: Send },
      { key: 'telegram', url: '/admin/telegram', icon: MessageCircle },
      { key: 'chat', url: '/admin/chat', icon: Bot },
    ],
  },
  {
    id: 5,
    key: 'system',
    items: [
      { key: 'users', url: '/admin/users', icon: Users },
      { key: 'email_templates', url: '/admin/email-templates', icon: Mail },
      { key: 'notifications', url: '/admin/notifications', icon: Bell },
      { key: 'storage', url: '/admin/storage', icon: HardDrive },
      { key: 'db', url: '/admin/db', icon: Database },
      { key: 'audit', url: '/admin/audit', icon: FileSearch },
      { key: 'reports', url: '/admin/reports', icon: BarChart },
    ],
  },
];

export type AdminNavCopy = {
  labels: Record<AdminNavGroupKey, string>;
  items: Record<AdminNavItemKey, string>;
};

// Fallback titles for when translations are missing
const FALLBACK_TITLES: Record<AdminNavItemKey, string> = {
  dashboard: 'Dashboard',
  site_settings: 'Site Settings',
  custom_pages: 'Custom Pages',
  services: 'Services',
  sliders: 'Sliders',
  menu_items: 'Menu Items',
  footer_sections: 'Footer Sections',
  faqs: 'FAQs',
  contacts: 'Contacts',
  reviews: 'Reviews',
  bookings: 'Bookings',
  mail: 'Mail',
  users: 'Users',
  email_templates: 'Email Templates',
  notifications: 'Notifications',
  storage: 'Storage',
  db: 'Database',
  audit: 'Audit',
  availability: 'Availability',
  reports: 'Reports',
  telegram: 'Telegram',
  chat: 'Chat & AI',
};

export function buildAdminSidebarItems(
  copy?: Partial<AdminNavCopy> | null,
  t?: TranslateFn,
): NavGroup[] {
  const labels = copy?.labels ?? ({} as AdminNavCopy['labels']);
  const items = copy?.items ?? ({} as AdminNavCopy['items']);

  return adminNavConfig.map((group) => {
    // 1. Try copy.labels[group.key]
    // 2. Try t(`admin.sidebar.groups.${group.key}`)
    // 3. Fallback to empty (or key)
    const label =
      labels[group.key] || (t ? t(`admin.sidebar.groups.${group.key}` as any) : '') || '';

    return {
      id: group.id,
      label,
      items: group.items.map((item) => {
        // 1. Try copy.items[item.key]
        // 2. Try t(`admin.dashboard.items.${item.key}`)
        // 3. Fallback to FALLBACK_TITLES
        // 4. Fallback to key
        const title =
          items[item.key] ||
          (t ? t(`admin.dashboard.items.${item.key}` as any) : '') ||
          FALLBACK_TITLES[item.key] ||
          item.key;

        return {
          title,
          url: item.url,
          icon: item.icon,
        };
      }),
    };
  });
}
