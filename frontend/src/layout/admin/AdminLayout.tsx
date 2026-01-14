'use client';

import type { ReactNode } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';

export type ActiveTab =
  | 'dashboard'
  | 'site_settings'
  | 'custom_pages'
  | 'services'
  | 'slider'
  | 'bookings'
  | 'availability'
  | 'resources'
  | 'faqs'
  | 'contacts'
  | 'email_templates'
  | 'users'
  | 'db'
  | 'reviews'
  | 'menuitem'
  | 'footer_sections'
  | 'storage';

type AdminLayoutProps = {
  activeTab: ActiveTab;
  onTabChange: (v: ActiveTab) => void;
  onNavigateHome?: () => void;
  onNavigateLogin?: () => void;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

const MOBILE_MQ = '(max-width: 767.98px)';

export default function AdminLayout({
  activeTab,
  onTabChange,
  onNavigateHome,
  onNavigateLogin,
  header,
  footer,
  children,
}: AdminLayoutProps) {
  /**
   * ✅ SSR / hydration FIX
   * - Initial state MUST be identical on server and on the first client render.
   * - Therefore: do NOT read matchMedia / localStorage in initializers.
   */
  const [hydrated, setHydrated] = useState(false);

  // deterministik initial: desktop varsay (expanded)
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    setHydrated(true);

    if (typeof window === 'undefined') return;

    const mq = window.matchMedia(MOBILE_MQ);

    const apply = (matches: boolean) => {
      setIsMobile(matches);

      // breakpoint değişince default davranış:
      // mobile -> collapsed, desktop -> expanded
      setSidebarCollapsed(matches);
    };

    // ilk uygulama
    apply(mq.matches);

    const handler = (e: MediaQueryListEvent) => apply(e.matches);

    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', handler);
    else mq.addListener(handler);

    return () => {
      if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', handler);
      else mq.removeListener(handler);
    };
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((p) => !p);
  }, []);

  /**
   * ✅ className hydration FIX:
   * - İlk render’da server ile aynı class basılsın diye,
   *   collapsed/expanded class'ını hydration sonrası ekliyoruz.
   */
  const shellClass =
    'konigsmassage-admin-shell d-flex min-vh-100 bg-light ' +
    (hydrated ? (sidebarCollapsed ? 'konigsmassage-admin--collapsed' : 'konigsmassage-admin--expanded') : '');

  return (
    <div className={shellClass} data-mobile={hydrated && isMobile ? '1' : '0'}>
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        onNavigateHome={onNavigateHome}
        onNavigateLogin={onNavigateLogin}
      />

      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        {React.isValidElement(header)
          ? React.cloneElement(header as any, {
              onToggleSidebar: toggleSidebar,
              sidebarCollapsed,
              isMobile,
            })
          : header}

        <main role="main" className="flex-grow-1 overflow-auto p-3 p-md-4" style={{ minHeight: 0 }}>
          {children}
        </main>

        {footer}
      </div>
    </div>
  );
}
