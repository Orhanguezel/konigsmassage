// =============================================================
// FILE: src/components/admin/footer-sections/FooterSectionsFormPage.tsx
// konigsmassage – Footer Section Form Sayfası (Create/Edit + JSON)
// MenuItem pattern aligned
//
// EXTRA:
// - Footer Links paneli: menu_items (location=footer, section_id=<footer_section_id>)
// - listMenuItems paramları MenuItem modülü ile aynı: sort/order/display_order
// - edit navigation: /admin/menuitem/[id] (id bazlı)
// =============================================================

'use client';

import React, { useEffect, useMemo, useState, FormEvent, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import type { FooterSectionDto, AdminMenuItemDto } from '@/integrations/types';

import {
  useCreateFooterSectionAdminMutation,
  useUpdateFooterSectionAdminMutation,
  useLazyGetFooterSectionAdminQuery,

  // menu items
  useListMenuItemsAdminQuery,
  useUpdateMenuItemAdminMutation,
  useDeleteMenuItemAdminMutation,
} from '@/integrations/rtk/hooks';

import { useAdminLocales } from '@/components/common/useAdminLocales';

import { FooterSectionsForm, type FooterSectionsFormValues } from './FooterSectionsForm';
import {
  FooterSectionsFormHeader,
  type FooterSectionsFormEditMode,
} from './FooterSectionsFormHeader';
import { FooterSectionsFormJsonSection } from './FooterSectionsFormJsonSection';

/* -------------------- helpers -------------------- */

function pickFirstString(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return undefined;
}

const toShortLocale = (v: unknown): string =>
  String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

const toBool = (v: unknown) => v === true || v === 1 || v === '1' || v === 'true';

type FooterSectionsFormPageProps = {
  mode: 'create' | 'edit';
  initialData?: FooterSectionDto | null;
  loading?: boolean;
  onDone?: () => void;
};

type FooterSectionsFormState = FooterSectionsFormValues & {
  id?: string;
};

const mapDtoToFormState = (item: FooterSectionDto): FooterSectionsFormState => ({
  id: String((item as any).id ?? ''),
  locale: toShortLocale((item as any).locale_resolved ?? (item as any).locale ?? 'de'),

  is_active: toBool((item as any).is_active),
  display_order: (item as any).display_order ?? 0,

  title: (item as any).title ?? '',
  slug: (item as any).slug ?? '',
  description: (item as any).description ?? '',

  meta: (item as any).meta ?? {},
});

const buildJsonModelFromForm = (s: FooterSectionsFormState) => ({
  locale: s.locale,

  is_active: !!s.is_active,
  display_order: Number(s.display_order) || 0,

  title: s.title || '',
  slug: s.slug || '',
  description: s.description || null,

  meta: s.meta ?? {},
});

const FooterSectionsFormPage: React.FC<FooterSectionsFormPageProps> = ({
  mode,
  initialData,
  loading: externalLoading,
  onDone,
}) => {
  const router = useRouter();

  const [formState, setFormState] = useState<FooterSectionsFormState | null>(null);
  const [editMode, setEditMode] = useState<FooterSectionsFormEditMode>('form');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isLocaleChanging, setIsLocaleChanging] = useState(false);

  const didInitCreateRef = useRef(false);
  const didInitEditRef = useRef(false);

  const [triggerGet] = useLazyGetFooterSectionAdminQuery();

  const [createRow, { isLoading: isCreating }] = useCreateFooterSectionAdminMutation();
  const [updateRow, { isLoading: isUpdating }] = useUpdateFooterSectionAdminMutation();

  // menu items mutations
  const [updateMenuItem, { isLoading: isUpdatingMenuItem }] = useUpdateMenuItemAdminMutation();
  const [deleteMenuItem, { isLoading: isDeletingMenuItem }] = useDeleteMenuItemAdminMutation();

  const {
    localeOptions: adminLocaleOptions,
    defaultLocaleFromDb,
    coerceLocale,
    loading: localesLoading,
  } = useAdminLocales();

  const localeOptions = useMemo(
    () =>
      (adminLocaleOptions ?? []).map((x) => ({
        value: toShortLocale(x.value),
        label: x.label,
      })),
    [adminLocaleOptions],
  );

  // URL locale priority: query.locale > router.locale > DB default
  const effectiveLocale = useMemo(() => {
    const q = pickFirstString(router.query.locale);
    const r = typeof router.locale === 'string' ? router.locale : undefined;
    const resolved = coerceLocale(q ?? r, defaultLocaleFromDb) || q || r || defaultLocaleFromDb;
    return toShortLocale(resolved) || 'de';
  }, [router.query.locale, router.locale, coerceLocale, defaultLocaleFromDb]);

  const saving = isCreating || isUpdating;
  const loading = !!externalLoading || localesLoading;

  const setUrlLocale = useCallback(
    (nextLocale: string) => {
      const nextQuery = { ...router.query, locale: nextLocale };
      router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
    },
    [router],
  );

  // footer_section id (editte net, createte kaydedene kadar yok)
  const sectionId = useMemo(() => {
    const idFromState = formState?.id ? String(formState.id) : '';
    const idFromInitial = initialData ? String((initialData as any)?.id ?? '') : '';
    return idFromState || idFromInitial || '';
  }, [formState?.id, initialData]);

  /* -------------------- init: edit/create -------------------- */

  useEffect(() => {
    if (!router.isReady) return;
    if (localesLoading) return;

    if (mode === 'edit') {
      if (didInitEditRef.current) return;
      if (formState) return;

      didInitEditRef.current = true;

      if (initialData) {
        setFormState(mapDtoToFormState(initialData));
        return;
      }

      // initialData gelmemişse boş state kur (query fetch ile dolacak diye)
      const initLocale = effectiveLocale || localeOptions[0]?.value || 'de';
      setFormState({
        id: String(router.query.id ?? ''),
        locale: toShortLocale(initLocale),
        is_active: true,
        display_order: 0,
        title: '',
        slug: '',
        description: '',
        meta: {},
      });
      return;
    }

    // create
    if (mode === 'create') {
      if (didInitCreateRef.current) return;
      if (formState) return;
      if (!localeOptions.length) return;

      didInitCreateRef.current = true;

      const initLocale = toShortLocale(effectiveLocale || localeOptions[0]?.value || 'de') || 'de';

      setFormState({
        id: undefined,
        locale: initLocale,
        is_active: true,
        display_order: 0,
        title: '',
        slug: '',
        description: '',
        meta: {},
      });

      setUrlLocale(initLocale);
    }
  }, [
    router.isReady,
    localesLoading,
    mode,
    formState,
    initialData,
    effectiveLocale,
    localeOptions,
    setUrlLocale,
    router.query.id,
  ]);

  /* -------------------- footer links (menu_items) -------------------- */
  // MenuItem list paramları: location, section_id, locale, sort, order, active, q
  const menuListParams = useMemo(() => {
    if (!sectionId) return null;

    const loc = toShortLocale(formState?.locale || effectiveLocale || defaultLocaleFromDb || 'de');

    return {
      location: 'footer',
      section_id: sectionId,
      locale: loc,
      sort: 'display_order',
      order: 'asc',
      limit: 500,
      offset: 0,
    };
  }, [sectionId, formState?.locale, effectiveLocale, defaultLocaleFromDb]);

  const skipMenu =
    !router.isReady ||
    localesLoading ||
    !menuListParams ||
    !menuListParams.locale ||
    !menuListParams.section_id;

  const {
    data: menuData,
    isLoading: isMenuLoading,
    isFetching: isMenuFetching,
    refetch: refetchMenuItems,
  } = useListMenuItemsAdminQuery(menuListParams as any, { skip: skipMenu } as any);

  const menuItems: AdminMenuItemDto[] = useMemo(() => {
    const d: any = menuData as any;
    const items = Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : [];
    return items as AdminMenuItemDto[];
  }, [menuData]);

  /* -------------------- locale change -------------------- */

  const handleLocaleChange = async (nextLocaleRaw: string) => {
    if (!formState) return;

    const nextLocale =
      toShortLocale(coerceLocale(nextLocaleRaw, defaultLocaleFromDb) || nextLocaleRaw) || 'de';

    setFormState((prev) => (prev ? { ...prev, locale: nextLocale } : prev));
    setUrlLocale(nextLocale);

    if (mode === 'create') return;

    const baseId = formState.id || String((initialData as any)?.id ?? '');
    if (!baseId) return;

    try {
      setIsLocaleChanging(true);

      const data = await triggerGet({ id: String(baseId), locale: nextLocale }).unwrap();
      setFormState(mapDtoToFormState(data as FooterSectionDto));
      toast.success('Dil içeriği yüklendi.');

      await refetchMenuItems?.();
    } catch (err: any) {
      const status = err?.status ?? err?.originalStatus;
      if (status === 404) {
        toast.info('Bu dil için kayıt yok. Kaydettiğinde bu dil için yeni kayıt oluşturulacak.');
        // 404'te formState korunur; footer linkleri yine locale’e göre listelenir.
        await refetchMenuItems?.();
      } else {
        console.error('Footer locale change error:', err);
        toast.error('Seçilen dil için footer section yüklenirken bir hata oluştu.');
      }
    } finally {
      setIsLocaleChanging(false);
    }
  };

  /* -------------------- JSON -> Form sync -------------------- */

  const applyJsonToForm = (json: any) => {
    setFormState((prev) => {
      if (!prev) return prev;
      const next: FooterSectionsFormState = { ...prev };

      if (typeof json.locale === 'string') {
        const coerced = toShortLocale(
          coerceLocale(json.locale, defaultLocaleFromDb) || json.locale,
        );
        next.locale = coerced || prev.locale;
        setUrlLocale(next.locale);
      }

      if (typeof json.is_active === 'boolean') next.is_active = json.is_active;
      if (typeof json.display_order === 'number' && Number.isFinite(json.display_order)) {
        next.display_order = json.display_order;
      }

      if (typeof json.title === 'string') next.title = json.title;
      if (typeof json.slug === 'string') next.slug = json.slug;

      if (typeof json.description === 'string') next.description = json.description;
      if (json.description === null) next.description = '';

      if (json.meta !== undefined) next.meta = json.meta;

      return next;
    });
  };

  /* -------------------- submit -------------------- */

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formState) return;

    if (editMode === 'json' && jsonError) {
      toast.error('JSON geçerli değil.');
      return;
    }

    const title = formState.title.trim();
    const slug = formState.slug.trim();

    if (!title || !slug) {
      toast.error('Title ve slug zorunludur.');
      return;
    }

    const normalizedLocale =
      toShortLocale(coerceLocale(formState.locale, defaultLocaleFromDb) || formState.locale) ||
      'de';

    const payload = {
      title,
      slug,
      description: formState.description.trim() ? formState.description.trim() : null,
      locale: normalizedLocale || undefined,
      is_active: formState.is_active ? '1' : '0',
      display_order: Number(formState.display_order) || 0,
      meta: formState.meta ?? {},
    };

    try {
      if (mode === 'create') {
        const created = await createRow(payload as any).unwrap();
        toast.success('Footer section oluşturuldu.');

        const newId = String((created as any)?.id ?? '');
        if (newId) {
          const qs = normalizedLocale ? `?locale=${encodeURIComponent(normalizedLocale)}` : '';
          router.replace(`/admin/footer-sections/${encodeURIComponent(newId)}${qs}`);
          return;
        }
      } else if (mode === 'edit' && formState.id) {
        await updateRow({ id: String(formState.id), data: payload } as any).unwrap();
        toast.success('Footer section güncellendi.');
      } else {
        await createRow(payload as any).unwrap();
        toast.success('Footer section oluşturuldu.');
      }

      if (onDone) onDone();
      else router.push('/admin/footer-sections');
    } catch (err: any) {
      console.error('Footer save error:', err);
      toast.error(
        err?.data?.error?.message || err?.message || 'Footer section kaydedilirken hata oluştu.',
      );
    }
  };

  const handleCancel = () => {
    if (onDone) onDone();
    else router.push('/admin/footer-sections');
  };

  /* -------------------- Footer Links actions -------------------- */

  const goMenuItemEdit = (mi: AdminMenuItemDto) => {
    const id = String((mi as any)?.id || '');
    if (!id) return;

    const loc = formState?.locale ? toShortLocale(formState.locale) : effectiveLocale;
    const qs = loc ? `?locale=${encodeURIComponent(loc)}` : '';

    // MenuItem modülü pattern: id bazlı route
    router.push(`/admin/menuitem/${encodeURIComponent(id)}${qs}`);
  };

  const goMenuItemCreate = () => {
    const loc = formState?.locale ? toShortLocale(formState.locale) : effectiveLocale;

    const qs =
      `?location=footer` +
      (sectionId ? `&section_id=${encodeURIComponent(sectionId)}` : '') +
      (loc ? `&locale=${encodeURIComponent(loc)}` : '');

    router.push(`/admin/menuitem/new${qs}`);
  };

  const handleToggleMenuItemActive = async (mi: AdminMenuItemDto, value: boolean) => {
    try {
      await updateMenuItem({
        id: String((mi as any).id),
        data: { is_active: value ? '1' : '0' } as any,
      } as any).unwrap();

      toast.success('Link güncellendi.');
      await refetchMenuItems?.();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Link güncellenemedi.');
    }
  };

  const handleDeleteMenuItem = async (mi: AdminMenuItemDto) => {
    const label = String((mi as any)?.title || (mi as any)?.slug || (mi as any)?.id || 'link');
    if (!window.confirm(`"${label}" linkini silmek üzeresin. Devam edilsin mi?`)) return;

    try {
      await deleteMenuItem({ id: String((mi as any).id) } as any).unwrap();
      toast.success('Link silindi.');
      await refetchMenuItems?.();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Link silinemedi.');
    }
  };

  /* -------------------- guards -------------------- */

  if (mode === 'edit' && loading && !initialData) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center text-muted small py-5">
          <div className="spinner-border spinner-border-sm me-2" />
          Footer section yükleniyor...
        </div>
      </div>
    );
  }

  if (mode === 'edit' && !loading && !initialData) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning small">Kayıt bulunamadı veya silinmiş olabilir.</div>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleCancel}>
          ← Listeye dön
        </button>
      </div>
    );
  }

  if (!formState) {
    return (
      <div className="container-fluid py-4 text-muted small">
        <div className="spinner-border spinner-border-sm me-2" />
        Form hazırlanıyor...
      </div>
    );
  }

  const jsonModel = buildJsonModelFromForm(formState);

  const footerLinksBusy =
    isMenuLoading ||
    isMenuFetching ||
    isUpdatingMenuItem ||
    isDeletingMenuItem ||
    saving ||
    isLocaleChanging;

  return (
    <div className="container-fluid py-4">
      <div className="card">
        <FooterSectionsFormHeader
          mode={mode}
          locale={formState.locale}
          editMode={editMode}
          saving={saving}
          localesLoading={localesLoading}
          isLocaleChanging={isLocaleChanging}
          onChangeEditMode={setEditMode}
          onCancel={handleCancel}
        />

        <form onSubmit={handleSubmit}>
          <div className="card-body">
            {editMode === 'form' ? (
              <FooterSectionsForm
                mode={mode}
                values={formState}
                onChange={(field, value) =>
                  setFormState((prev) => (prev ? { ...prev, [field]: value } : prev))
                }
                onLocaleChange={handleLocaleChange}
                saving={saving || loading || isLocaleChanging}
                localeOptions={localeOptions}
                localesLoading={localesLoading || isLocaleChanging}
              />
            ) : (
              <FooterSectionsFormJsonSection
                jsonModel={jsonModel}
                disabled={saving || loading || isLocaleChanging}
                onChangeJson={applyJsonToForm}
                onErrorChange={setJsonError}
              />
            )}
          </div>

          <div className="card-footer d-flex justify-content-end">
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving || isLocaleChanging}
            >
              {saving ? 'Kaydediliyor...' : mode === 'create' ? 'Oluştur' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>

      {/* FOOTER LINKS PANEL */}
      <div className="card mt-3">
        <div className="card-header py-2 d-flex justify-content-between align-items-center">
          <div>
            <div className="fw-semibold">Footer Links</div>
            <div className="text-muted small">
              Kaynak: <code>menu_items</code> (location=footer, section_id={sectionId || '-'})
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => refetchMenuItems?.()}
              disabled={footerLinksBusy || !sectionId}
            >
              Yenile
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={goMenuItemCreate}
              disabled={footerLinksBusy || !sectionId}
              title={!sectionId ? 'Önce footer section kaydedilmeli' : undefined}
            >
              + Yeni Link
            </button>
          </div>
        </div>

        <div className="card-body p-0">
          {!sectionId ? (
            <div className="p-3 text-muted small">
              Footer linklerini yönetebilmek için önce Footer Section kaydını oluşturmalısın.
            </div>
          ) : footerLinksBusy ? (
            <div className="p-3 text-muted small">
              <span className="spinner-border spinner-border-sm me-2" />
              Linkler yükleniyor...
            </div>
          ) : menuItems.length === 0 ? (
            <div className="p-3 text-muted small">Bu section altında footer linki yok.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 70 }}>Sıra</th>
                    <th>Başlık</th>
                    <th style={{ width: 320 }}>URL</th>
                    <th style={{ width: 90 }} className="text-center">
                      Aktif
                    </th>
                    <th style={{ width: 200 }} className="text-end">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map((mi: any, idx: number) => {
                    const isActive = toBool(mi?.is_active);
                    const orderNum = Number.isFinite(Number(mi?.display_order))
                      ? Number(mi.display_order)
                      : idx + 1;

                    const title = String(mi?.title ?? mi?.slug ?? mi?.id ?? '');
                    const url = String(mi?.url ?? '');

                    return (
                      <tr key={String(mi?.id ?? idx)}>
                        <td className="text-muted small">#{orderNum}</td>
                        <td style={{ minWidth: 240 }}>
                          <div className="fw-semibold">
                            {title || <span className="text-muted">-</span>}
                          </div>
                          <div className="text-muted small">
                            slug: <code>{String(mi?.slug ?? '-')}</code>
                          </div>
                        </td>
                        <td style={{ minWidth: 220 }}>
                          {url ? (
                            <div className="text-truncate" title={url} style={{ maxWidth: 520 }}>
                              <code>{url}</code>
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-flex m-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={isActive}
                              disabled={footerLinksBusy}
                              onChange={(e) => handleToggleMenuItemActive(mi, e.target.checked)}
                            />
                          </div>
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => goMenuItemEdit(mi)}
                              disabled={footerLinksBusy}
                            >
                              Düzenle
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDeleteMenuItem(mi)}
                              disabled={footerLinksBusy}
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="p-2 small text-muted">
                Not: “Düzenle” butonu Menu Item edit sayfasına yönlendirir (id bazlı route).
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FooterSectionsFormPage;
