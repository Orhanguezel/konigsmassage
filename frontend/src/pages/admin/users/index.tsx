// =============================================================
// FILE: src/pages/admin/users/index.tsx
// konigsmassage – Admin Users Sayfası
// (Liste + filtreler + edit modal: profil, rol, aktiflik, şifre)
// =============================================================

'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

import {
  useListUsersAdminQuery,
  useUpdateUserAdminMutation,
  useSetUserActiveAdminMutation,
  useSetUserRolesAdminMutation,
  useSetUserPasswordAdminMutation,
  useRemoveUserAdminMutation,
} from '@/integrations/rtk/hooks';

import type { AdminUserDto, AdminUserRoleName } from '@/integrations/types';

import { UsersHeader } from '@/components/admin/users/UsersHeader';
import { UsersList } from '@/components/admin/users/UsersList';

/* ------------------------------------------------------------- */
/*  Form state tipi                                               */
/* ------------------------------------------------------------- */

type UserFormState = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  is_active: boolean;
  role: AdminUserRoleName;
  // Admin tarafından atanacak yeni şifre (boş bırakılırsa değiştirme)
  password: string;
};

/* ------------------------------------------------------------- */
/*  Page Component                                               */
/* ------------------------------------------------------------- */

const UsersAdminPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'' | AdminUserRoleName>('');
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  // Liste + filtreler
  const {
    data: users,
    isLoading,
    isFetching,
    refetch,
  } = useListUsersAdminQuery({
    q: search || undefined,
    role: roleFilter || undefined,
    is_active: showOnlyActive ? true : undefined,
    sort: 'created_at',
    order: 'desc',
  });

  const rows: AdminUserDto[] = users || [];

  // Mutations
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserAdminMutation();
  const [setActive, { isLoading: isSettingActive }] = useSetUserActiveAdminMutation();
  const [setRoles, { isLoading: isSettingRoles }] = useSetUserRolesAdminMutation();
  const [setPassword, { isLoading: isSettingPassword }] = useSetUserPasswordAdminMutation();
  const [removeUser, { isLoading: isDeleting }] = useRemoveUserAdminMutation();

  const loading = isLoading || isFetching;
  const busy =
    loading || isUpdating || isSettingActive || isSettingRoles || isSettingPassword || isDeleting;

  /* -------------------- Form / Modal state -------------------- */

  const [formState, setFormState] = useState<UserFormState | null>(null);
  const [originalRole, setOriginalRole] = useState<AdminUserRoleName | null>(null);
  const [showModal, setShowModal] = useState(false);

  const openEditModal = (user: AdminUserDto) => {
    setFormState({
      id: user.id,
      email: user.email,
      full_name: user.full_name ?? '',
      phone: user.phone ?? '',
      is_active:
        user.is_active === 1 || (user.is_active as any) === true || (user.is_active as any) === '1',
      role: user.role,
      password: '',
    });
    setOriginalRole(user.role);
    setShowModal(true);
  };

  const closeModal = () => {
    if (busy) return;
    setShowModal(false);
    setFormState(null);
    setOriginalRole(null);
  };

  const handleFormChange = (field: keyof UserFormState, value: string | boolean) => {
    setFormState((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  /* -------------------- Save (update + roles + password) ----- */

  const handleSaveForm = async () => {
    if (!formState) return;

    const email = formState.email.trim();
    const fullName = formState.full_name.trim();
    const phone = formState.phone.trim();
    const password = formState.password.trim();

    if (!email) {
      toast.error('E-posta alanı boş bırakılamaz.');
      return;
    }

    // Basit validasyonlar (backend zod ile uyumlu)
    if (fullName && fullName.length < 2) {
      toast.error('İsim alanı en az 2 karakter olmalıdır.');
      return;
    }
    if (phone && phone.length < 6) {
      toast.error('Telefon alanı en az 6 karakter olmalıdır.');
      return;
    }
    if (password && password.length < 8) {
      toast.error('Yeni şifre en az 8 karakter olmalıdır.');
      return;
    }

    try {
      // 1) Temel user update
      await updateUser({
        id: formState.id,
        patch: {
          email,
          full_name: fullName || undefined,
          phone: phone || undefined,
          is_active: formState.is_active,
        },
      }).unwrap();

      // 2) Rol değiştiyse roller set
      if (originalRole && formState.role !== originalRole) {
        await setRoles({
          id: formState.id,
          body: { roles: [formState.role] },
        }).unwrap();
      }

      // 3) Şifre girilmişse şifreyi güncelle
      if (password) {
        await setPassword({
          id: formState.id,
          body: { password },
        }).unwrap();
      }

      toast.success('Kullanıcı bilgileri güncellendi.');
      closeModal();
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.data?.error ||
        err?.message ||
        'Kullanıcı güncellenirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  /* -------------------- Toggle Active ------------------------ */

  const handleToggleActive = async (user: AdminUserDto, value: boolean) => {
    try {
      await setActive({
        id: user.id,
        body: { is_active: value },
      }).unwrap();
      // Arkaplanda refetch
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.data?.error ||
        err?.message ||
        'Aktif durumu güncellenirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  /* -------------------- Delete ------------------------------- */

  const handleDelete = async (user: AdminUserDto) => {
    if (
      !window.confirm(`"${user.email}" kullanıcısını silmek üzeresin. Devam etmek istiyor musun?`)
    ) {
      return;
    }

    try {
      await removeUser(user.id).unwrap();
      toast.success('Kullanıcı silindi.');
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.data?.error ||
        err?.message ||
        'Kullanıcı silinirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  /* -------------------- Render ------------------------------- */

  return (
    <div className="container-fluid py-4">
      <UsersHeader
        search={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        showOnlyActive={showOnlyActive}
        onShowOnlyActiveChange={setShowOnlyActive}
        loading={busy}
        onRefresh={refetch}
      />

      <div className="row">
        <div className="col-12">
          <UsersList
            items={rows}
            loading={busy}
            onEdit={openEditModal}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* --------------------- Edit Modal --------------------- */}
      {showModal && formState && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header py-2">
                  <h5 className="modal-title small mb-0">Kullanıcıyı Düzenle</h5>
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
                    {/* Email */}
                    <div className="col-md-6">
                      <label className="form-label small">E-posta</label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        value={formState.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                      />
                    </div>

                    {/* Full name */}
                    <div className="col-md-6">
                      <label className="form-label small">İsim Soyisim (opsiyonel)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formState.full_name}
                        onChange={(e) => handleFormChange('full_name', e.target.value)}
                      />
                    </div>

                    {/* Phone */}
                    <div className="col-md-6">
                      <label className="form-label small">Telefon (opsiyonel)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formState.phone}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                      />
                    </div>

                    {/* Role */}
                    <div className="col-md-3">
                      <label className="form-label small">Rol</label>
                      <select
                        className="form-select form-select-sm"
                        value={formState.role}
                        onChange={(e) =>
                          handleFormChange('role', e.target.value as AdminUserRoleName)
                        }
                      >
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                        <option value="user">User</option>
                      </select>
                    </div>

                    {/* Active switch */}
                    <div className="col-md-3 d-flex align-items-end">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="user-modal-active"
                          checked={formState.is_active}
                          onChange={(e) => handleFormChange('is_active', e.target.checked)}
                        />
                        <label className="form-check-label small" htmlFor="user-modal-active">
                          Aktif
                        </label>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="col-12">
                      <label className="form-label small">
                        Yeni Şifre (boş bırakılırsa değiştirilmez)
                      </label>
                      <input
                        type="password"
                        className="form-control form-control-sm"
                        value={formState.password}
                        onChange={(e) => handleFormChange('password', e.target.value)}
                        placeholder="En az 8 karakter"
                      />
                      <div className="form-text small">
                        Bu alan yalnızca admin tarafından şifre resetlemek için kullanılır. Boş
                        bırakırsan mevcut şifre korunur.
                      </div>
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

export default UsersAdminPage;
