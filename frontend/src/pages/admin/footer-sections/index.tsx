// =============================================================
// FILE: src/pages/admin/footer-sections/index.tsx
// konigsmassage – Admin Footer Sections Sayfası (Liste + filtreler)
// + EXTRA: Footer Links (menu_items location=footer) paneli
// - Locales: useAdminLocales()
// - locale: "" => all locales
// - MenuItem pattern aligned
// =============================================================

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import {
  useListFooterSectionsAdminQuery,
  useUpdateFooterSectionAdminMutation,
  useDeleteFooterSectionAdminMutation,

  // ✅ footer links (menu_items)
  useDeleteMenuItemAdminMutation,
  useListMenuItemsAdminQuery,
  useReorderMenuItemsAdminMutation,
} from '@/integrations/rtk/hooks';

import { useAdminLocales } from '@/components/common/useAdminLocales';
import type { FooterSectionDto, AdminMenuItemDto } from '@/integrations/types';

import {
  FooterSectionsHeader,
  type LocaleOption,
  type FooterSectionOrderField,
} from '@/components/admin/footer-sections/FooterSectionsHeader';
import { FooterSectionsList } from '@/components/admin/footer-sections/FooterSectionsList';

// ✅ Menü list UI bileşenlerini reuse ediyoruz
import { MenuItemHeader, type MenuItemFilters } from '@/components/admin/menuitem/MenuItemHeader';
import { MenuItemList } from '@/components/admin/menuitem/MenuItemList';

/* -------------------- helpers -------------------- */

const toShortLocale = (v: unknown): string =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

/* -------------------- Types -------------------- */

type FooterSectionsListQuery = {
  q?: string;
  is_active?: '1' | '0';
  sort?: FooterSectionOrderField;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  locale?: string; // "" => all (göndermezsek all)
};

const FooterSectionsAdminPage: React.FC = () => {
  const router = useRouter();

  /* ============================================================
   *  A) FOOTER SECTIONS (mevcut)
   * ============================================================ */

  const [search, setSearch] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const [orderBy, setOrderBy] = useState<FooterSectionOrderField>('display_order');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  // "" => all locales
  const [locale, setLocale] = useState<string>('');

  const {
    localeOptions: adminLocaleOptions,
    defaultLocaleFromDb,
    coerceLocale,
    loading: localesLoading,
  } = useAdminLocales();

  const baseLocales: LocaleOption[] = useMemo(() => {
    const arr = adminLocaleOptions ?? [];
    return arr.map((x) => ({
      value: toShortLocale(x.value),
      label: x.label,
    }));
  }, [adminLocaleOptions]);

  // Header zaten "Tüm diller" opsiyonunu gerekirse ekliyor; burada sadece valid locale listesi veriyoruz.
  const localeOptions: LocaleOption[] = useMemo(() => baseLocales, [baseLocales]);

  // query.locale -> state
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query.locale;
    const qLocale = typeof q === 'string' ? q : Array.isArray(q) ? q[0] : '';
    const normalized = toShortLocale(qLocale);
    if (!normalized) return;

    const coerced = coerceLocale(normalized, defaultLocaleFromDb) || normalized;
    setLocale(toShortLocale(coerced));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  // state.locale valid mi?
  useEffect(() => {
    if (!baseLocales.length) return;
    if (!locale) return;

    const valid = new Set(baseLocales.map((x) => x.value));
    if (!valid.has(locale)) setLocale('');
  }, [baseLocales, locale]);

  const handleLocaleChange = (next: string) => {
    const raw = toShortLocale(next);
    if (!raw) {
      setLocale('');
      const nextQuery = { ...router.query };
      delete (nextQuery as any).locale;
      router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
      return;
    }

    const coerced = coerceLocale(raw, defaultLocaleFromDb) || raw;
    const nextLocale = toShortLocale(coerced);
    setLocale(nextLocale);

    router.replace(
      { pathname: router.pathname, query: { ...router.query, locale: nextLocale } },
      undefined,
      { shallow: true },
    );
  };

  const listParams = useMemo<FooterSectionsListQuery>(
    () => ({
      q: search?.trim() ? search.trim() : undefined,
      is_active: showOnlyActive ? '1' : undefined,
      sort: orderBy,
      order,
      limit: 200,
      offset: 0,
      locale: locale || undefined,
    }),
    [search, showOnlyActive, orderBy, order, locale],
  );

  const {
    data: footerSectionsData,
    isLoading: isFooterSectionsLoading,
    isFetching: isFooterSectionsFetching,
    refetch: refetchFooterSections,
  } = useListFooterSectionsAdminQuery(listParams as any);

  const listRows: FooterSectionDto[] = useMemo(() => {
    return (footerSectionsData?.items ?? []) as FooterSectionDto[];
  }, [footerSectionsData?.items]);

  const [rows, setRows] = useState<FooterSectionDto[]>([]);
  useEffect(() => {
    setRows(listRows ?? []);
  }, [listRows]);

  const [updateRow, { isLoading: isUpdatingFooterSection }] = useUpdateFooterSectionAdminMutation();
  const [deleteRow, { isLoading: isDeletingFooterSection }] = useDeleteFooterSectionAdminMutation();

  const footerSectionsLoading =
    isFooterSectionsLoading || isFooterSectionsFetching || localesLoading;
  const footerSectionsBusy =
    footerSectionsLoading || isUpdatingFooterSection || isDeletingFooterSection;

  const handleCreateClick = () => {
    const qs = locale ? `?locale=${encodeURIComponent(locale)}` : '';
    router.push(`/admin/footer-sections/new${qs}`);
  };

  const handleEditRow = (item: FooterSectionDto) => {
    const qs = locale ? `?locale=${encodeURIComponent(locale)}` : '';
    router.push(`/admin/footer-sections/${encodeURIComponent(String((item as any).id))}${qs}`);
  };

  const handleDeleteFooterSection = async (item: FooterSectionDto) => {
    const label = (item as any).title || (item as any).slug || (item as any).id;

    if (!window.confirm(`"${label}" kaydını silmek üzeresin. Devam etmek istiyor musun?`)) return;

    try {
      await deleteRow((item as any).id).unwrap();
      toast.success(`"${label}" silindi.`);
      await refetchFooterSections();
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || 'Kayıt silinirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  const handleToggleFooterSectionActive = async (item: FooterSectionDto, value: boolean) => {
    try {
      await updateRow({
        id: (item as any).id,
        data: { is_active: value ? '1' : '0' },
      } as any).unwrap();

      setRows((prev) =>
        prev.map((r: any) =>
          String(r.id) === String((item as any).id) ? { ...r, is_active: value ? 1 : 0 } : r,
        ),
      );
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.message ||
        'Aktiflik durumu güncellenirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  /* ============================================================
   *  B) FOOTER LINKS (menu_items location=footer) - YENİ PANEL
   * ============================================================ */

  // localeOptions -> MenuItemHeader beklediği format
  const menuLocaleOptions = useMemo(
    () =>
      (adminLocaleOptions ?? []).map((x) => ({
        value: String(x.value),
        label: x.label,
      })),
    [adminLocaleOptions],
  );

  const localeLabelMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const x of menuLocaleOptions) m[toShortLocale(x.value)] = x.label;
    return m;
  }, [menuLocaleOptions]);

  const defaultLocale = useMemo(() => {
    const fromDb = defaultLocaleFromDb || '';
    if (fromDb) return toShortLocale(fromDb) || 'de';

    const routerLocale = (router.locale as string | undefined) ?? undefined;
    const coerced = coerceLocale(routerLocale, defaultLocaleFromDb);
    return toShortLocale(coerced) || toShortLocale(routerLocale) || 'de';
  }, [defaultLocaleFromDb, coerceLocale, router.locale]);

  // Footer link filters (MenuItemHeader + MenuItemList reuse)
  const [footerLinkFilters, setFooterLinkFilters] = useState<MenuItemFilters>(() => ({
    search: '',
    location: 'footer' as const,
    active: 'all',
    sort: 'display_order',
    order: 'asc',
    locale: '', // "" => all
  }));

  // Footer-sections sayfasındaki locale seçimi varsa, istersen footer links'e de otomatik uygula:
  useEffect(() => {
    // locale === '' ise tüm diller; doluysa footer links filtre locale'ini buna eşitleyelim
    setFooterLinkFilters((prev) => {
      const target = locale ? toShortLocale(locale) : '';
      if (toShortLocale(prev.locale) === target) return prev;
      return { ...prev, locale: target };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const footerLinksListParams = useMemo(() => {
    const p: any = {};

    if (footerLinkFilters.search?.trim()) p.q = footerLinkFilters.search.trim();

    // ✅ footer only
    p.location = 'footer';

    if (footerLinkFilters.active !== 'all') p.active = footerLinkFilters.active === 'active';
    if (footerLinkFilters.sort) p.sort = footerLinkFilters.sort;
    if (footerLinkFilters.order) p.order = footerLinkFilters.order;

    const loc = toShortLocale(footerLinkFilters.locale);
    if (loc) p.locale = loc;

    // footer linklerin sayısı çok olabiliyor:
    p.limit = 500;
    p.offset = 0;

    return p;
  }, [footerLinkFilters]);

  const {
    data: footerLinksData,
    isFetching: isFooterLinksFetching,
    refetch: refetchFooterLinks,
  } = useListMenuItemsAdminQuery(footerLinksListParams as any);

  const footerLinksItems: AdminMenuItemDto[] = useMemo(() => {
    const items = (footerLinksData as any)?.items;
    return (Array.isArray(items) ? items : []) as AdminMenuItemDto[];
  }, [footerLinksData]);

  const footerLinksTotal = useMemo(() => {
    const t = (footerLinksData as any)?.total;
    return typeof t === 'number' ? t : footerLinksItems.length;
  }, [footerLinksData, footerLinksItems.length]);

  const [deleteFooterLink, { isLoading: isDeletingFooterLink }] = useDeleteMenuItemAdminMutation();
  const [reorderFooterLinks, { isLoading: isReorderingFooterLinks }] =
    useReorderMenuItemsAdminMutation();

  // reorder buffer
  const [draftFooterLinks, setDraftFooterLinks] = useState<AdminMenuItemDto[] | null>(null);

  useEffect(() => {
    setDraftFooterLinks(null);
  }, [footerLinksData?.items]);

  const footerLinksRows = draftFooterLinks ?? footerLinksItems;
  const footerLinksSavingOrder = isReorderingFooterLinks;

  const footerLinksLoading = isFooterLinksFetching || localesLoading || isDeletingFooterLink;
  const footerLinksBusy = footerLinksLoading || footerLinksSavingOrder;

  const handleFooterLinksReorder = (next: AdminMenuItemDto[]) => {
    setDraftFooterLinks(next);
  };

  const handleFooterLinksSaveOrder = async () => {
    if (!draftFooterLinks || draftFooterLinks.length === 0) return;

    try {
      const payload = {
        items: draftFooterLinks.map((x, idx) => ({
          id: x.id,
          display_order: idx + 1,
        })),
      } as any;

      await reorderFooterLinks(payload).unwrap();
      toast.success('Footer link sıralaması kaydedildi.');
      setDraftFooterLinks(null);
      refetchFooterLinks();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Sıralama kaydedilemedi.');
    }
  };

  const goToCreateFooterLink = () => {
    const loc = toShortLocale(footerLinkFilters.locale) || '';
    const qs = `?location=footer` + (loc ? `&locale=${encodeURIComponent(loc)}` : '');
    router.push(`/admin/menuitem/new${qs}`);
  };

  const goToEditFooterLink = (item: AdminMenuItemDto) => {
    const loc = toShortLocale(footerLinkFilters.locale) || '';
    const qs = loc ? `?locale=${encodeURIComponent(loc)}` : '';
    router.push(`/admin/menuitem/${encodeURIComponent(item.id)}${qs}`);
  };

  const handleDeleteFooterLink = async (item: AdminMenuItemDto) => {
    const ok = window.confirm(`"${item.title || 'Bu kayıt'}" silinsin mi?`);
    if (!ok) return;

    try {
      await deleteFooterLink({ id: item.id } as any).unwrap();
      toast.success('Footer link silindi.');
      refetchFooterLinks();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Silme başarısız.');
    }
  };

  /* ============================================================
   *  Render
   * ============================================================ */

  return (
    <div className="container-fluid py-4">
      {/* ===================== FOOTER SECTIONS ===================== */}
      <FooterSectionsHeader
        search={search}
        onSearchChange={setSearch}
        locale={locale}
        onLocaleChange={handleLocaleChange}
        locales={localeOptions}
        localesLoading={localesLoading}
        showOnlyActive={showOnlyActive}
        onShowOnlyActiveChange={setShowOnlyActive}
        orderBy={orderBy}
        orderDir={order}
        onOrderByChange={setOrderBy}
        onOrderDirChange={setOrder}
        loading={footerSectionsBusy}
        onRefresh={refetchFooterSections}
        onCreateClick={handleCreateClick}
      />

      <div className="row">
        <div className="col-12">
          <FooterSectionsList
            items={rows}
            loading={footerSectionsBusy}
            onEdit={handleEditRow}
            onDelete={handleDeleteFooterSection}
            onToggleActive={handleToggleFooterSectionActive}
          />
        </div>
      </div>

      {/* ===================== FOOTER LINKS (MENU ITEMS) ===================== */}
      <div className="mt-4">
        <div className="card">
          <div className="card-header py-2 d-flex justify-content-between align-items-center">
            <div>
              <div className="fw-semibold">Footer Links</div>
              <div className="text-muted small">
                Kaynak: <code>menu_items</code> (location=<code>footer</code>)
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => refetchFooterLinks()}
                disabled={footerLinksBusy}
              >
                Yenile
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={goToCreateFooterLink}
                disabled={footerLinksBusy}
              >
                + Yeni Footer Link
              </button>
            </div>
          </div>

          <div className="card-body">
            <MenuItemHeader
              filters={footerLinkFilters}
              total={footerLinksTotal}
              loading={footerLinksBusy}
              locales={menuLocaleOptions}
              localesLoading={localesLoading}
              defaultLocale={defaultLocale}
              onFiltersChange={setFooterLinkFilters}
              onRefresh={() => refetchFooterLinks()}
              onCreateClick={goToCreateFooterLink}
            />

            <MenuItemList
              items={footerLinksRows}
              loading={footerLinksBusy}
              onEdit={goToEditFooterLink}
              onDelete={handleDeleteFooterLink}
              onReorder={handleFooterLinksReorder}
              onSaveOrder={draftFooterLinks ? handleFooterLinksSaveOrder : undefined}
              savingOrder={footerLinksSavingOrder}
              localeLabelMap={localeLabelMap}
              dateLocale="tr-TR"
              // footer panelde location zaten sabit, kolonu gizleyelim
              hideLocationColumn
            />

            {draftFooterLinks && (
              <div className="mt-2 small text-muted">
                Sıralama değişti. Kalıcı yapmak için <strong>Sıralamayı Kaydet</strong> butonunu
                kullan.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterSectionsAdminPage;
