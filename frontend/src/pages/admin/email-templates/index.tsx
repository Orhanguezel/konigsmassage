// =============================================================
// FILE: src/pages/admin/email-templates/index.tsx
// konigsmassage – Admin Email Templates Liste Sayfası
// - Dynamic locales from DB via useAdminLocales()
// - No hardcoded locales
// =============================================================

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import {
  useListEmailTemplatesAdminQuery,
  useUpdateEmailTemplateAdminMutation,
  useDeleteEmailTemplateAdminMutation,
} from '@/integrations/rtk/hooks';

import type {
  EmailTemplateAdminListItemDto,
  EmailTemplateAdminListQueryParams,
} from '@/integrations/types';

import {
  EmailTemplateHeader,
  type LocaleOption,
} from '@/components/admin/email-templates/EmailTemplateHeader';
import { EmailTemplateList } from '@/components/admin/email-templates/EmailTemplateList';

import { useAdminLocales } from '@/components/common/useAdminLocales';

const EmailTemplatesAdminPage: React.FC = () => {
  const router = useRouter();

  const {
    localeOptions: adminLocaleOptions,
    defaultLocaleFromDb,
    coerceLocale,
    loading: localesLoading,
  } = useAdminLocales();

  /* -------------------- Filtre state -------------------- */
  const [search, setSearch] = useState('');
  const [locale, setLocale] = useState(''); // "" = tüm diller
  const [isActiveFilter, setIsActiveFilter] = useState<'' | 'active' | 'inactive'>('');

  /* -------------------- Locale options (DB) -------------------- */

  const localeOptions: LocaleOption[] = useMemo(() => {
    return (adminLocaleOptions ?? [])
      .map((o) => ({
        value: String(o.value || '').toLowerCase(),
        label: o.label,
      }))
      .filter((o) => !!o.value);
  }, [adminLocaleOptions]);

  const handleLocaleChange = (next: string) => {
    const normalized = next ? next.trim().toLowerCase() : '';

    // "" => tüm diller
    if (!normalized) {
      setLocale('');
      return;
    }

    // DB'de yoksa default'a düş
    const safe = coerceLocale(normalized, defaultLocaleFromDb);
    setLocale(safe || '');
  };

  /* -------------------- Liste + filtreler -------------------- */

  const listParams = useMemo<EmailTemplateAdminListQueryParams | void>(() => {
    const params: EmailTemplateAdminListQueryParams = {};

    if (search.trim()) params.q = search.trim();

    // locale seçiliyse güvenli locale gönder
    if (locale.trim()) {
      const safe = coerceLocale(locale.trim(), defaultLocaleFromDb);
      if (safe) params.locale = safe;
    }

    if (isActiveFilter === 'active') params.is_active = 1;
    else if (isActiveFilter === 'inactive') params.is_active = 0;

    return Object.keys(params).length > 0 ? params : undefined;
  }, [search, locale, isActiveFilter, coerceLocale, defaultLocaleFromDb]);

  const {
    data: listData,
    isLoading,
    isFetching,
    refetch,
  } = useListEmailTemplatesAdminQuery(listParams);

  const [rows, setRows] = useState<EmailTemplateAdminListItemDto[]>([]);

  useEffect(() => {
    setRows(listData ?? []);
  }, [listData]);

  const total = rows.length;

  /* -------------------- Mutations ----------------------------- */

  const [updateTemplate, { isLoading: isUpdating }] = useUpdateEmailTemplateAdminMutation();
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteEmailTemplateAdminMutation();

  const loading = isLoading || isFetching;
  const busy = loading || isUpdating || isDeleting || localesLoading;

  /* -------------------- Actions ----------------------- */

  const handleCreateClick = () => {
    router.push('/admin/email-templates/new');
  };

  const handleEdit = (item: EmailTemplateAdminListItemDto) => {
    // filtre locale seçiliyse edit sayfasına query ile taşı
    const q = locale ? `?locale=${encodeURIComponent(locale)}` : '';
    router.push(`/admin/email-templates/${item.id}${q}`);
  };

  const handleDelete = async (item: EmailTemplateAdminListItemDto) => {
    if (
      !window.confirm(
        `"${item.template_key}" şablonunu silmek üzeresin. Devam etmek istiyor musun?`,
      )
    ) {
      return;
    }

    try {
      await deleteTemplate(item.id).unwrap();
      toast.success(`"${item.template_key}" silindi.`);
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.data?.error ||
        err?.message ||
        'Şablon silinirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  const handleToggleActive = async (item: EmailTemplateAdminListItemDto, value: boolean) => {
    try {
      await updateTemplate({
        id: item.id,
        patch: { is_active: value },
      }).unwrap();

      setRows((prev) => prev.map((r) => (r.id === item.id ? { ...r, is_active: value } : r)));
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.data?.error ||
        err?.message ||
        'Aktif durumu güncellenirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  /* -------------------- Render -------------------- */

  return (
    <div className="container-fluid py-4">
      <EmailTemplateHeader
        search={search}
        onSearchChange={setSearch}
        locale={locale}
        onLocaleChange={handleLocaleChange}
        locales={localeOptions}
        localesLoading={localesLoading}
        isActiveFilter={isActiveFilter}
        onIsActiveFilterChange={setIsActiveFilter}
        loading={busy}
        total={total}
        onRefresh={refetch}
        onCreateClick={handleCreateClick}
      />

      <div className="row">
        <div className="col-12">
          <EmailTemplateList
            items={rows}
            loading={busy}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
          />
        </div>
      </div>
    </div>
  );
};

export default EmailTemplatesAdminPage;
