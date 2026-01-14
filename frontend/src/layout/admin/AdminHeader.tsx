// src/components/layout/admin/AdminHeader.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { useRouter } from 'next/router';

import { ClientOnly } from '@/components/common/ClientOnly';

import {
  useListNotificationsQuery,
  useGetUnreadNotificationsCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/integrations/rtk/hooks';

type AdminHeaderProps = {
  onBackHome: () => void;

  // ✅ yeni
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
};

export default function AdminHeader({
  onBackHome,
  onToggleSidebar,
  sidebarCollapsed,
}: AdminHeaderProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { data: unreadData } = useGetUnreadNotificationsCountQuery();
  const unreadCount = unreadData?.count ?? 0;

  const {
    data: notifications,
    isLoading: isListLoading,
    refetch,
  } = useListNotificationsQuery({ limit: 20, offset: 0 }, { skip: !open });

  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();
  const [markRead] = useMarkNotificationReadMutation();

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleToggleDropdown = () => setOpen((p) => !p);

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
      await refetch();
    } catch {
      // ignore
    }
  };

  const handleItemClick = async (id: string, is_read: boolean) => {
    if (!is_read) {
      try {
        await markRead({ id, is_read: true }).unwrap();
        await refetch();
      } catch {
        // ignore
      }
    }
  };

  return (
    <header className="border-bottom bg-white">
      <div className="container-fluid d-flex align-items-center justify-content-between py-2 px-3">
        <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
          {/* ✅ Sidebar toggle (ClientOnly: hydration mismatch fix) */}
          <button
            type="button"
            className="btn btn-outline-dark btn-sm d-inline-flex align-items-center"
            onClick={onToggleSidebar}
            aria-label="Menüyü aç/kapat"
            title="Menüyü aç/kapat"
            disabled={!onToggleSidebar}
          >
            <ClientOnly fallback={<PanelLeftClose size={16} />}>
              {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </ClientOnly>
          </button>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Bildirim çanı + dropdown */}
          <div className="position-relative" ref={dropdownRef}>
            <button
              type="button"
              className="btn btn-outline-dark btn-sm position-relative d-inline-flex align-items-center"
              onClick={handleToggleDropdown}
              aria-label="Bildirimler"
            >
              <Bell size={16} className="me-0 me-md-1" />
              <span className="d-none d-md-inline fw-semibold">Bildirimler</span>

              {unreadCount > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style={{ fontSize: '0.65rem' }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div className="position-absolute end-0 mt-2" style={{ zIndex: 1050, minWidth: 320 }}>
                <div className="card shadow-sm border">
                  <div className="card-header py-2 d-flex justify-content-between align-items-center">
                    <span className="small fw-bold text-dark">Bildirimler</span>
                    <div className="d-flex align-items-center gap-2">
                      {isListLoading && (
                        <span className="spinner-border spinner-border-sm text-secondary" />
                      )}
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 small fw-semibold"
                        disabled={isMarkingAll || unreadCount === 0}
                        onClick={handleMarkAllRead}
                      >
                        Tümünü okundu yap
                      </button>
                    </div>
                  </div>

                  <div
                    className="list-group list-group-flush"
                    style={{ maxHeight: 360, overflowY: 'auto' }}
                  >
                    {!notifications || notifications.length === 0 ? (
                      <div className="list-group-item small text-muted text-center py-3">
                        Bildirim bulunmuyor.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          className={
                            'list-group-item list-group-item-action small text-start ' +
                            (!n.is_read ? 'fw-semibold' : '')
                          }
                          onClick={() => handleItemClick(n.id, n.is_read)}
                        >
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <span className="text-dark text-truncate" style={{ maxWidth: 220 }}>
                              {n.title}
                            </span>
                            {!n.is_read && (
                              <span className="badge bg-primary-subtle text-primary">Yeni</span>
                            )}
                          </div>

                          <div className="text-muted mt-1">
                            {n.message.length > 120 ? n.message.slice(0, 117) + '...' : n.message}
                          </div>

                          <div className="text-muted mt-1">
                            <small>{new Date(n.created_at).toLocaleString('tr-TR')}</small>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="card-footer py-2 d-flex justify-content-between align-items-center">
                    <small className="text-muted">En son 20 bildirim listeleniyor.</small>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 small fw-semibold"
                      onClick={() => {
                        setOpen(false);
                        router.push('/admin/site-settings');
                      }}
                    >
                      Site ayarlarına git
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ana sayfa butonu */}
          <button type="button" className="btn btn-outline-dark btn-sm" onClick={onBackHome}>
            <span className="d-none d-md-inline fw-semibold">← Ana sayfaya dön</span>
            <span className="d-inline d-md-none fw-semibold">←</span>
          </button>
        </div>
      </div>
    </header>
  );
}
