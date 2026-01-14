// =============================================================
// FILE: src/pages/admin/site-settings/[id].tsx
// konigsmassage – Site Setting Detail Form (Structured + Raw)
// - Route: /admin/site-settings/[id]?locale=tr|en|*
// - Uses SiteSettingsForm
// - Locale source: site_settings(app_locales + default_locale) like Services module
// - FIX: Add General/UI structured renderers (contact_info, socials, businessHours, company_profile, ui_header)
// - FALLBACK: If no structured form, "structured" uses JSON editor
// =============================================================

import React, { useEffect, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
  useDeleteSiteSettingAdminMutation,
} from '@/integrations/rtk/hooks';

import type { SiteSetting, SettingValue } from '@/integrations/types';

import { SiteSettingsForm } from '@/components/admin/site-settings/SiteSettingsForm';
import { AdminJsonEditor } from '@/components/common/AdminJsonEditor';
import { SeoStructuredForm } from '@/components/admin/site-settings/tabs/structured/SeoStructuredForm';

import {
  ContactInfoStructuredForm,
  contactFormToObj,
  contactObjToForm,
  type ContactInfoFormState,
} from '@/components/admin/site-settings/tabs/structured/ContactInfoStructuredForm';

import {
  SocialsStructuredForm,
  socialsFormToObj,
  socialsObjToForm,
  type SocialsFormState,
} from '@/components/admin/site-settings/tabs/structured/SocialsStructuredForm';

import {
  CompanyProfileStructuredForm,
  companyFormToObj,
  companyObjToForm,
  type CompanyProfileFormState,
} from '@/components/admin/site-settings/tabs/structured/CompanyProfileStructuredForm';

import {
  UiHeaderStructuredForm,
  uiHeaderFormToObj,
  uiHeaderObjToForm,
  type UiHeaderFormState,
} from '@/components/admin/site-settings/tabs/structured/UiHeaderStructuredForm';

import {
  BusinessHoursStructuredForm,
  businessHoursFormToObj,
  businessHoursObjToForm,
  type BusinessHoursFormState,
} from '@/components/admin/site-settings/tabs/structured/BusinessHoursStructuredForm';

import type { AdminLocaleOption } from '@/components/common/AdminLocaleSelect';

/* ----------------------------- helpers ----------------------------- */

type AppLocaleItem = {
  code: string;
  label?: string;
  is_active?: boolean;
  is_default?: boolean;
};

const toShortLocale = (v: unknown): string =>
  String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

function uniqByCode(items: AppLocaleItem[]): AppLocaleItem[] {
  const seen = new Set<string>();
  const out: AppLocaleItem[] = [];
  for (const it of items) {
    const code = toShortLocale(it?.code);
    if (!code) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    out.push({ ...it, code });
  }
  return out;
}

function buildLocaleLabel(item: AppLocaleItem): string {
  const code = toShortLocale(item.code);
  const label = String(item.label || '').trim();
  if (label) return `${label} (${code})`;

  let dn: Intl.DisplayNames | null = null;
  try {
    dn = new Intl.DisplayNames([code || 'de'], { type: 'language' });
  } catch {
    dn = null;
  }
  const name = dn?.of(code) ?? '';
  return name ? `${name} (${code})` : `${code.toUpperCase()} (${code})`;
}

function parseAppLocalesValue(raw: unknown): AppLocaleItem[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((x: any) => ({
        code: toShortLocale(x?.code ?? x),
        label: x?.label,
        is_active: x?.is_active,
        is_default: x?.is_default,
      }))
      .filter((x) => !!x.code);
  }

  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      return parseAppLocalesValue(parsed);
    } catch {
      return [];
    }
  }

  if (typeof raw === 'object' && raw !== null) {
    const anyObj = raw as any;
    if (Array.isArray(anyObj.locales)) return parseAppLocalesValue(anyObj.locales);
  }

  return [];
}

function isSeoKey(key: string) {
  const k = String(key || '')
    .trim()
    .toLowerCase();
  return k === 'seo' || k === 'site_seo' || k === 'site_meta_default';
}

const GENERAL_KEYS = [
  'contact_info',
  'socials',
  'businessHours',
  'company_profile',
  'ui_header',
] as const;
type GeneralKey = (typeof GENERAL_KEYS)[number];

function isGeneralKey(key: string): key is GeneralKey {
  return (GENERAL_KEYS as readonly string[]).includes(String(key || '').trim() as any);
}

/** value string(JSON) ise parse etmeyi dene */
function coerceSettingValue(input: any): any {
  if (input === null || input === undefined) return input;
  if (typeof input === 'object') return input;

  if (typeof input === 'string') {
    const s = input.trim();
    if (!s) return input;

    const looksJson =
      (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));

    if (!looksJson) return input;

    try {
      return JSON.parse(s);
    } catch {
      return input;
    }
  }

  return input;
}

/* ----------------------------- structured renderers (named) ----------------------------- */

type StructuredRenderProps = {
  value: SettingValue;
  setValue: (next: any) => void;
  disabled?: boolean;
};

const JsonStructuredRenderer: React.FC<StructuredRenderProps> = ({ value, setValue, disabled }) => {
  const v = coerceSettingValue(value ?? {});
  return (
    <div>
      <div className="alert alert-secondary small py-2">
        Bu key için özel structured form tanımlı değil. JSON editor “structured” olarak çalışır.
      </div>

      <AdminJsonEditor
        label="Structured JSON"
        value={v ?? {}}
        onChange={(next) => setValue(next)}
        disabled={disabled}
        helperText="Blur olduğunda parse edilir. Geçersiz JSON kaydedilmez."
        height={340}
      />
    </div>
  );
};
JsonStructuredRenderer.displayName = 'JsonStructuredRenderer';

type SeoStructuredRendererProps = StructuredRenderProps & {
  settingKey: string;
  locale: string;
};

const SeoStructuredRenderer: React.FC<SeoStructuredRendererProps> = ({
  settingKey,
  locale,
  value,
  setValue,
  disabled,
}) => {
  return (
    <SeoStructuredForm
      settingKey={settingKey}
      locale={locale}
      value={value}
      setValue={setValue}
      disabled={disabled}
    />
  );
};
SeoStructuredRenderer.displayName = 'SeoStructuredRenderer';

/* ----------------------------- General structured renderers ----------------------------- */

type GeneralStructuredRendererProps = StructuredRenderProps & {
  seedKey: GeneralKey;
};

const ContactStructuredRenderer: React.FC<GeneralStructuredRendererProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = useMemo(() => {
    const v = coerceSettingValue(value) ?? {};
    return typeof v === 'object' && v ? v : {};
  }, [value]);

  const [form, setForm] = useState<ContactInfoFormState>(() =>
    contactObjToForm(base, { phone: '', email: '', address: '', whatsapp: '' } as any),
  );

  useEffect(() => {
    setForm(contactObjToForm(base, { phone: '', email: '', address: '', whatsapp: '' } as any));
  }, [base]);

  const handleChange = (next: ContactInfoFormState) => {
    setForm(next);
    setValue(contactFormToObj(next));
  };

  return (
    <ContactInfoStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={{ phone: '', email: '', address: '', whatsapp: '' } as any}
    />
  );
};

const SocialsStructuredRenderer: React.FC<GeneralStructuredRendererProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = useMemo(() => {
    const v = coerceSettingValue(value) ?? {};
    return typeof v === 'object' && v ? v : {};
  }, [value]);

  const [form, setForm] = useState<SocialsFormState>(() =>
    socialsObjToForm(base, {
      instagram: '',
      facebook: '',
      linkedin: '',
      youtube: '',
      x: '',
    } as any),
  );

  useEffect(() => {
    setForm(
      socialsObjToForm(base, {
        instagram: '',
        facebook: '',
        linkedin: '',
        youtube: '',
        x: '',
      } as any),
    );
  }, [base]);

  const handleChange = (next: SocialsFormState) => {
    setForm(next);
    setValue(socialsFormToObj(next));
  };

  return (
    <SocialsStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={{ instagram: '', facebook: '', linkedin: '', youtube: '', x: '' } as any}
    />
  );
};

const CompanyStructuredRenderer: React.FC<GeneralStructuredRendererProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = useMemo(() => {
    const v = coerceSettingValue(value) ?? {};
    return typeof v === 'object' && v ? v : {};
  }, [value]);

  const [form, setForm] = useState<CompanyProfileFormState>(() =>
    companyObjToForm(base, { company_name: 'konigsmassage', slogan: '', about: '' } as any),
  );

  useEffect(() => {
    setForm(
      companyObjToForm(base, { company_name: 'konigsmassage', slogan: '', about: '' } as any),
    );
  }, [base]);

  const handleChange = (next: CompanyProfileFormState) => {
    setForm(next);
    setValue(companyFormToObj(next));
  };

  return (
    <CompanyProfileStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={{ company_name: 'konigsmassage', slogan: '', about: '' } as any}
    />
  );
};

const UiHeaderStructuredRenderer: React.FC<GeneralStructuredRendererProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = useMemo(() => {
    const v = coerceSettingValue(value) ?? {};
    return typeof v === 'object' && v ? v : {};
  }, [value]);

  const seed = useMemo(
    () =>
      ({
        nav_home: 'Home',
        nav_products: 'Products',
        nav_services: 'Services',
        nav_contact: 'Contact',
        cta_label: 'Get Offer',
      } as any),
    [],
  );

  const [form, setForm] = useState<UiHeaderFormState>(() => uiHeaderObjToForm(base, seed));

  useEffect(() => {
    setForm(uiHeaderObjToForm(base, seed));
  }, [base, seed]);

  const handleChange = (next: UiHeaderFormState) => {
    setForm(next);
    setValue(uiHeaderFormToObj(next));
  };

  return (
    <UiHeaderStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={seed}
    />
  );
};

const BusinessHoursStructuredRenderer: React.FC<GeneralStructuredRendererProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = useMemo(() => {
    const v = coerceSettingValue(value);
    return Array.isArray(v) ? v : [];
  }, [value]);

  const seed = useMemo(
    () =>
      [
        { day: 'mon', open: '09:00', close: '18:00', closed: false },
        { day: 'tue', open: '09:00', close: '18:00', closed: false },
        { day: 'wed', open: '09:00', close: '18:00', closed: false },
        { day: 'thu', open: '09:00', close: '18:00', closed: false },
        { day: 'fri', open: '09:00', close: '18:00', closed: false },
        { day: 'sat', open: '10:00', close: '14:00', closed: false },
        { day: 'sun', open: '00:00', close: '00:00', closed: true },
      ] as any,
    [],
  );

  const [form, setForm] = useState<BusinessHoursFormState>(() =>
    businessHoursObjToForm(base, seed),
  );

  useEffect(() => {
    setForm(businessHoursObjToForm(base, seed));
  }, [base, seed]);

  const handleChange = (next: BusinessHoursFormState) => {
    setForm(next);
    setValue(businessHoursFormToObj(next));
  };

  return (
    <BusinessHoursStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={seed}
    />
  );
};

/* ----------------------------- page ----------------------------- */

const SiteSettingDetailPage: NextPage = () => {
  const router = useRouter();

  const settingKey = useMemo(() => {
    const raw = router.query?.id;
    if (Array.isArray(raw)) return raw[0] || '';
    return String(raw || '').trim();
  }, [router.query?.id]);

  // Locales – site_settings(app_locales + default_locale)
  const {
    data: localeSettingsRows,
    isLoading: isLocalesLoading,
    isFetching: isLocalesFetching,
  } = useListSiteSettingsAdminQuery({
    keys: ['app_locales', 'default_locale'],
  });

  const { localeOptions, defaultLocaleFromDb } = useMemo(() => {
    const rows = localeSettingsRows ?? [];
    const appRow = rows.find((r: any) => r.key === 'app_locales');
    const defRow = rows.find((r: any) => r.key === 'default_locale');

    const itemsRaw = parseAppLocalesValue(appRow?.value);
    const active = itemsRaw.filter((x) => x && x.code && x.is_active !== false);
    const uniq = uniqByCode(active);

    const def = toShortLocale(defRow?.value);

    const options: AdminLocaleOption[] = uniq.map((it) => ({
      value: toShortLocale(it.code),
      label: buildLocaleLabel(it),
    }));

    const optionsWithGlobal: AdminLocaleOption[] = [
      { value: '*', label: 'Global (*)' },
      ...options,
    ];

    return { localeOptions: optionsWithGlobal, defaultLocaleFromDb: def };
  }, [localeSettingsRows]);

  const localeFromQuery = useMemo(() => {
    const q = router.query?.locale;
    if (Array.isArray(q)) return String(q[0] || '').trim();
    return String(q || '').trim();
  }, [router.query?.locale]);

  const initialLocale = useMemo(() => {
    const qLocale = localeFromQuery === '*' ? '*' : toShortLocale(localeFromQuery);

    if (qLocale && localeOptions.some((x) => x.value === qLocale)) return qLocale;

    if (defaultLocaleFromDb && localeOptions.some((x) => x.value === defaultLocaleFromDb))
      return defaultLocaleFromDb;

    const firstNonGlobal = localeOptions.find((x) => x.value !== '*');
    return firstNonGlobal?.value || localeOptions?.[0]?.value || '';
  }, [localeFromQuery, localeOptions, defaultLocaleFromDb]);

  const [selectedLocale, setSelectedLocale] = useState<string>('');

  // init/repair locale
  useEffect(() => {
    if (!router.isReady) return;
    if (!localeOptions.length) return;

    setSelectedLocale((prev) => {
      if (prev && localeOptions.some((x) => x.value === prev)) return prev;
      return initialLocale || '';
    });
  }, [router.isReady, localeOptions, initialLocale]);

  // keep url in sync when locale changes
  useEffect(() => {
    if (!router.isReady) return;
    if (!settingKey) return;
    if (!selectedLocale) return;

    const curRaw = router.query?.locale;
    const cur = Array.isArray(curRaw) ? String(curRaw[0] || '') : String(curRaw || '');
    const normalizedCur = cur === '*' ? '*' : toShortLocale(cur);

    if (normalizedCur === selectedLocale) return;

    void router.replace(
      { pathname: router.pathname, query: { id: settingKey, locale: selectedLocale } },
      undefined,
      { shallow: true },
    );
  }, [router, settingKey, selectedLocale]);

  // load single setting row
  const listArgs = useMemo(() => {
    if (!settingKey || !selectedLocale) return undefined;
    return { q: settingKey, locale: selectedLocale };
  }, [settingKey, selectedLocale]);

  const {
    data: rows,
    isLoading,
    isFetching,
    refetch,
  } = useListSiteSettingsAdminQuery(listArgs, {
    skip: !listArgs,
  });

  const row: SiteSetting | null = useMemo(() => {
    const arr = Array.isArray(rows) ? rows : [];
    const exact = arr.find(
      (r) => String(r?.key || '') === settingKey && String(r?.locale || '') === selectedLocale,
    );
    if (exact) return exact;

    const byKey = arr.find((r) => String(r?.key || '') === settingKey);
    return byKey || null;
  }, [rows, settingKey, selectedLocale]);

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const [deleteSetting, { isLoading: isDeleting }] = useDeleteSiteSettingAdminMutation();

  const busy =
    isLoading || isFetching || isSaving || isDeleting || isLocalesLoading || isLocalesFetching;

  const handleSave = async (args: { key: string; locale: string; value: SettingValue }) => {
    try {
      if (String(args.key).toLowerCase() === 'site_meta_default' && args.locale === '*') {
        toast.error('site_meta_default locale="*" olamaz. Dil seçip kaydet.');
        return;
      }

      await updateSetting(args).unwrap();
      toast.success(`"${args.key}" güncellendi.`);
      await refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Kaydetme sırasında hata oluştu.');
    }
  };

  const handleDelete = async (args: { key: string; locale?: string }) => {
    try {
      await deleteSetting({ key: args.key, locale: args.locale }).unwrap();
      toast.success(`"${args.key}" silindi.`);
      await refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Silme sırasında hata oluştu.');
    }
  };

  // choose structured renderer (SEO + General + fallback JSON)
  const renderStructured = useMemo(() => {
    if (!settingKey) return JsonStructuredRenderer;

    // SEO
    if (isSeoKey(settingKey)) {
      if (String(settingKey).toLowerCase() === 'site_meta_default') return JsonStructuredRenderer;

      const Wrapped: React.FC<StructuredRenderProps> = (p) => (
        <SeoStructuredRenderer
          settingKey={settingKey}
          locale={selectedLocale}
          value={p.value}
          setValue={p.setValue}
          disabled={p.disabled}
        />
      );
      Wrapped.displayName = 'SeoStructuredRendererWrapped';
      return Wrapped;
    }

    // GENERAL/UI
    if (isGeneralKey(settingKey)) {
      if (settingKey === 'contact_info') return ContactStructuredRenderer as any;
      if (settingKey === 'socials') return SocialsStructuredRenderer as any;
      if (settingKey === 'company_profile') return CompanyStructuredRenderer as any;
      if (settingKey === 'ui_header') return UiHeaderStructuredRenderer as any;
      if (settingKey === 'businessHours') return BusinessHoursStructuredRenderer as any;
    }

    // fallback JSON
    return JsonStructuredRenderer;
  }, [settingKey, selectedLocale]);

  const backHref = '/admin/site-settings';

  if (!router.isReady) {
    return (
      <div className="container-fluid py-4">
        <div className="text-muted small">Yükleniyor...</div>
      </div>
    );
  }

  if (!busy && (!localeOptions || localeOptions.length === 0)) {
    return (
      <div className="container-fluid py-4">
        <h4 className="h5 mb-2">Dil listesi bulunamadı</h4>
        <p className="text-muted small mb-3">
          <code>site_settings.app_locales</code> boş veya geçersiz. Önce Site Settings’ten dilleri
          ayarla.
        </p>
        <Link className="btn btn-sm btn-outline-secondary" href={backHref}>
          Site Ayarlarına git
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <div className="small text-muted">Site Ayarları</div>
          <h1 className="h4 mb-0">
            Düzenle: <code>{settingKey || '-'}</code>
          </h1>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link href={backHref} className="btn btn-outline-secondary btn-sm">
            Listeye Dön
          </Link>

          <div style={{ minWidth: 220 }}>
            <label className="form-label small mb-1">Locale</label>
            <select
              className="form-select form-select-sm"
              value={selectedLocale || ''}
              onChange={(e) => setSelectedLocale(e.target.value)}
              disabled={busy || !localeOptions.length}
            >
              {localeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => refetch()}
            disabled={busy}
          >
            Yenile
          </button>
        </div>
      </div>

      {!settingKey ? (
        <div className="alert alert-danger">Setting key bulunamadı.</div>
      ) : !selectedLocale ? (
        <div className="alert alert-secondary">Locale yükleniyor...</div>
      ) : (
        <SiteSettingsForm
          settingKey={settingKey}
          locale={selectedLocale}
          row={
            row
              ? ({
                  ...row,
                  value: coerceSettingValue(row.value), // ✅ string JSON -> object
                } as any)
              : null
          }
          disabled={busy}
          initialMode={'structured'}
          onSave={handleSave}
          onDelete={async ({ key, locale }) => handleDelete({ key, locale })}
          renderStructured={renderStructured as any}
        />
      )}

      <div className="mt-3 text-muted small">
        <strong>Not:</strong> General/UI key’lerde structured form artık detail sayfasında da
        açılır. Diğer tüm key’ler için Structured mod JSON editor fallback’tır.
      </div>
    </div>
  );
};

export default SiteSettingDetailPage;
