// src/components/layout/admin/AdminSidebar.tsx
// konigsmassage Admin Sidebar – sade, Bootstrap uyumlu (responsive via AdminLayout CSS)

'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  BarChart3,
  Package,
  Settings,
  LogOut,
  Home,
  FileText,
  FolderTree,
  HelpCircle,
  Users,
  Mail,
  ImageIcon,
  Calendar,
} from 'lucide-react';
import type { ActiveTab } from './AdminLayout';
import { useLogoutMutation } from '@/integrations/rtk/hooks';
import { tokenStore } from '@/integrations/core/token';

type AdminSidebarProps = {
  activeTab: ActiveTab;
  onTabChange: (v: ActiveTab) => void;
  onNavigateHome?: () => void;
  onNavigateLogin?: () => void;
};

type MenuItem = {
  title: string;
  value: ActiveTab;
  icon: React.ComponentType<any>;
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    label: 'Genel',
    items: [
      { title: 'Dashboard', value: 'dashboard', icon: BarChart3 },
      { title: 'Site Ayarları', value: 'site_settings', icon: Settings },
      { title: 'Sayfalar (Custom Pages)', value: 'custom_pages', icon: FileText },
      { title: 'Hizmetler', value: 'services', icon: FolderTree },
    ],
  },
  {
    label: 'İçerik Yönetimi',
    items: [
      { title: 'Müsaitlik', value: 'availability', icon: Calendar },
      { title: 'Kaynaklar', value: 'resources', icon: Package },
      { title: 'Randevuler', value: 'bookings', icon: Calendar },
      { title: 'Slider', value: 'slider', icon: ImageIcon },
      { title: 'SSS (FAQ)', value: 'faqs', icon: HelpCircle },
      { title: 'İletişim Mesajları', value: 'contacts', icon: Mail },
      { title: 'E-posta Şablonları', value: 'email_templates', icon: Mail },
      { title: 'Yorumlar', value: 'reviews', icon: FileText },
      { title: 'Menü Öğeleri', value: 'menuitem', icon: FolderTree },
      { title: 'Footer Bölümleri', value: 'footer_sections', icon: FolderTree },
      { title: 'Depolama', value: 'storage', icon: ImageIcon },
    ],
  },
  {
    label: 'Ayarlar',
    items: [
      { title: 'Kullanıcılar', value: 'users', icon: Users },
      { title: 'Veritabanı Araçları', value: 'db', icon: Settings },
    ],
  },
];

const NavButton = ({
  active,
  icon: Icon,
  title,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<any>;
  title: string;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title} // desktop fallback
      aria-label={title}
      className={
        'konigsmassage-nav-btn konigsmassage-tooltip w-100 d-flex align-items-center gap-2 px-3 py-2 rounded-2 border-0 text-start small ' +
        (active ? 'bg-white text-dark fw-semibold' : 'bg-transparent text-white')
      }
      style={{
        cursor: 'pointer',
        opacity: active ? 1 : 0.92,
      }}
      onMouseEnter={(e) => {
        if (active) return;
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.10)';
        (e.currentTarget as HTMLButtonElement).style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        if (active) return;
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        (e.currentTarget as HTMLButtonElement).style.opacity = '0.92';
      }}
    >
      <Icon size={16} />

      {/* Normal (desktop) text */}
      <span className="konigsmassage-sidebar-text flex-grow-1">{title}</span>

      {/* Mobile icon-only tooltip bubble (CSS ile sadece xs/sm’de gösterilecek) */}
      <span className="konigsmassage-nav-tooltip" role="tooltip">
        {title}
      </span>
    </button>
  );
};

export default function AdminSidebar({
  activeTab,
  onTabChange,
  onNavigateHome,
}: AdminSidebarProps) {
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      toast.error('Çıkış yapılırken bir hata oluştu (sunucu).');
    } finally {
      try {
        tokenStore.set(null);
        localStorage.removeItem('mh_refresh_token');
      } catch {
        // ignore
      }
      onNavigateHome?.();
    }
  };

  return (
    <aside
      className="konigsmassage-admin-sidebar bg-dark text-light d-flex flex-column flex-shrink-0"
      style={{ minHeight: '100vh' }}
    >
      {/* Logo / brand */}
      <div className="konigsmassage-sidebar-brand border-bottom border-secondary px-3 py-3 d-flex align-items-center gap-2">
        <div
          className="bg-primary text-white rounded-2 d-flex align-items-center justify-content-center"
          style={{ width: 32, height: 32 }}
          title="konigsmassage Admin"
        >
          <span className="fw-bold small">EN</span>
        </div>

        <div className="konigsmassage-sidebar-text flex-grow-1">
          <div className="fw-semibold text-white small">konigsmassage Admin</div>
          <div className="text-white small" style={{ opacity: 0.7 }}>
            Yönetim Paneli
          </div>
        </div>
      </div>

      {/* Menü grupları */}
      <div className="flex-grow-1 overflow-auto py-3">
        {menuGroups.map((group) => (
          <div key={group.label} className="konigsmassage-sidebar-group mb-3 px-3">
            <div
              className="konigsmassage-sidebar-group-label text-uppercase small mb-1"
              style={{ color: 'rgba(255,255,255,0.75)', letterSpacing: 0.5 }}
            >
              {group.label}
            </div>

            <div className="d-flex flex-column gap-1">
              {group.items.map((item) => (
                <NavButton
                  key={item.value}
                  active={activeTab === item.value}
                  icon={item.icon}
                  title={item.title}
                  onClick={() => onTabChange(item.value)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Alt kısım: Ana sayfa + Çıkış */}
      <div className="konigsmassage-sidebar-bottom border-top border-secondary px-3 py-3">
        <div className="d-flex flex-column gap-2">
          <button
            type="button"
            className="btn btn-outline-light btn-sm d-flex align-items-center gap-2 konigsmassage-tooltip"
            onClick={() => onNavigateHome?.()}
            title="Ana sayfaya dön"
            aria-label="Ana sayfaya dön"
          >
            <Home size={16} />
            <span className="konigsmassage-sidebar-text">Ana sayfaya dön</span>
            <span className="konigsmassage-nav-tooltip" role="tooltip">
              Ana sayfaya dön
            </span>
          </button>

          <button
            type="button"
            className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2 konigsmassage-tooltip"
            onClick={handleLogout}
            title="Çıkış yap"
            aria-label="Çıkış yap"
          >
            <LogOut size={16} />
            <span className="konigsmassage-sidebar-text">Çıkış yap</span>
            <span className="konigsmassage-nav-tooltip" role="tooltip">
              Çıkış yap
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
