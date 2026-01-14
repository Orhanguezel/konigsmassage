// =============================================================
// FILE: src/pages/admin/contact/index.tsx
// konigsmassage – Admin Contact Mesajları (Liste + filtreler + edit modal)
// =============================================================

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  useListContactsAdminQuery,
  useUpdateContactAdminMutation,
  useDeleteContactAdminMutation,
} from '@/integrations/rtk/hooks';

import type { ContactDto, ContactStatus } from '@/integrations/types';

import { ContactHeader } from '@/components/admin/contact/ContactHeader';
import { ContactList } from '@/components/admin/contact/ContactList';

// Sadece edit modu olduğu için FormMode kaldırıldı

type ContactFormState = {
  id: string;
  status: ContactStatus;
  is_resolved: boolean;
  admin_note: string;
};

const ContactAdminPage: React.FC = () => {
  /* -------------------- Filtre state -------------------- */
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | ContactStatus>('');
  const [showOnlyUnresolved, setShowOnlyUnresolved] = useState(false);

  const [orderBy, setOrderBy] = useState<'created_at' | 'updated_at' | 'status' | 'name'>(
    'created_at',
  );
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  /* -------------------- Liste + filtreler -------------------- */

  const listParams = useMemo(
    () => ({
      search: search || undefined,
      status: status || undefined,
      // Sadece çözülmemişler → resolved=false
      resolved: showOnlyUnresolved ? false : undefined,
      orderBy,
      order,
      limit: 200,
      offset: 0,
    }),
    [search, status, showOnlyUnresolved, orderBy, order],
  );

  const { data: listData, isLoading, isFetching, refetch } = useListContactsAdminQuery(listParams);

  const [rows, setRows] = useState<ContactDto[]>([]);

  useEffect(() => {
    setRows(listData ?? []);
  }, [listData]);

  const total = rows.length;

  /* -------------------- Mutations ----------------------------- */

  const [updateContact, { isLoading: isUpdating }] = useUpdateContactAdminMutation();
  const [deleteContact, { isLoading: isDeleting }] = useDeleteContactAdminMutation();

  const loading = isLoading || isFetching;
  const busy = loading || isUpdating || isDeleting;

  /* -------------------- Form / Modal state -------------------- */

  const [formState, setFormState] = useState<ContactFormState | null>(null);
  const [showModal, setShowModal] = useState(false);

  const openEditModal = (item: ContactDto) => {
    setFormState({
      id: item.id,
      status: item.status,
      is_resolved: !!item.is_resolved,
      admin_note: item.admin_note ?? '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (busy) return;
    setShowModal(false);
    setFormState(null);
  };

  const handleFormChange = (field: keyof ContactFormState, value: string | boolean) => {
    setFormState((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSaveForm = async () => {
    if (!formState) return;

    const patch = {
      status: formState.status,
      is_resolved: formState.is_resolved,
      admin_note: formState.admin_note.trim() || null,
    };

    try {
      await updateContact({
        id: formState.id,
        patch,
      }).unwrap();
      toast.success('İletişim kaydı güncellendi.');
      closeModal();
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error ||
        err?.data?.error?.message ||
        err?.message ||
        'Kayıt güncellenirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  /* -------------------- Delete / Toggle ----------------------- */

  const handleDelete = async (item: ContactDto) => {
    if (
      !window.confirm(
        `"${item.name} <${item.email}>" kaydını silmek üzeresin. Devam etmek istiyor musun?`,
      )
    ) {
      return;
    }

    try {
      await deleteContact(item.id).unwrap();
      toast.success(`"${item.name}" silindi.`);
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error ||
        err?.data?.error?.message ||
        err?.message ||
        'Kayıt silinirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  const handleToggleResolved = async (item: ContactDto, value: boolean) => {
    try {
      await updateContact({
        id: item.id,
        patch: { is_resolved: value },
      }).unwrap();

      setRows((prev) => prev.map((r) => (r.id === item.id ? { ...r, is_resolved: value } : r)));
    } catch (err: any) {
      const msg =
        err?.data?.error ||
        err?.data?.error?.message ||
        err?.message ||
        'Çözülme durumu güncellenirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  /* -------------------- Render -------------------- */

  return (
    <div className="container-fluid py-4">
      <ContactHeader
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        showOnlyUnresolved={showOnlyUnresolved}
        onShowOnlyUnresolvedChange={setShowOnlyUnresolved}
        orderBy={orderBy}
        order={order}
        onOrderByChange={setOrderBy}
        onOrderChange={setOrder}
        loading={busy}
        onRefresh={refetch}
        total={total}
      />

      <div className="row">
        <div className="col-12">
          <ContactList
            items={rows}
            loading={busy}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onToggleResolved={handleToggleResolved}
          />
        </div>
      </div>

      {/* --------------------- Edit Modal --------------------- */}
      {showModal && formState && (
        <>
          {/* Backdrop */}
          <div className="modal-backdrop fade show" />

          {/* Modal */}
          <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header py-2">
                  <h5 className="modal-title small mb-0">İletişim Kaydı Düzenle</h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Kapat"
                    onClick={closeModal}
                    disabled={busy}
                  />
                </div>

                <div className="modal-body">
                  <div className="row g-2">
                    <div className="col-md-4">
                      <label className="form-label small">Durum (status)</label>
                      <select
                        className="form-select form-select-sm"
                        value={formState.status}
                        onChange={(e) =>
                          handleFormChange('status', e.target.value as ContactStatus)
                        }
                      >
                        <option value="new">Yeni</option>
                        <option value="in_progress">Üzerinde Çalışılıyor</option>
                        <option value="closed">Kapalı</option>
                      </select>
                    </div>

                    <div className="col-md-4 d-flex align-items-end">
                      <div className="form-check form-switch small">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="contact-modal-resolved"
                          checked={formState.is_resolved}
                          onChange={(e) => handleFormChange('is_resolved', e.target.checked)}
                        />
                        <label className="form-check-label ms-1" htmlFor="contact-modal-resolved">
                          Çözüldü
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="form-label small">Yönetici Notu (admin_note)</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={4}
                      value={formState.admin_note}
                      onChange={(e) => handleFormChange('admin_note', e.target.value)}
                    />
                    <div className="form-text small">
                      Bu not sadece admin panelde görünür, kullanıcıya gönderilmez.
                    </div>
                  </div>
                </div>

                <div className="modal-footer py-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={closeModal}
                    disabled={busy}
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveForm}
                    disabled={busy}
                  >
                    {busy ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContactAdminPage;
