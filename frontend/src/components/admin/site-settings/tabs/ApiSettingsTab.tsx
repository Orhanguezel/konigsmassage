// =============================================================
// FILE: src/components/admin/site-settings/tabs/ApiSettingsTab.tsx
// konigsmassage – API & Entegrasyon Ayarları (GLOBAL)
// Fix:
//  - Query always requests locale='*' so GA4/GTM/cookie_consent appear.
//  - Adds missing GA4/GTM/cookie_consent fields in UI.
// =============================================================

import React from 'react';
import { toast } from 'sonner';

import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/rtk/hooks';

import type { SettingValue, SiteSetting } from '@/integrations/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export type ApiSettingsTabProps = {
  locale: string; // UI badge için dursun
};

const API_KEYS = [
  'google_client_id',
  'google_client_secret',
  'gtm_container_id',
  'ga4_measurement_id',
  'cookie_consent',
] as const;

type ApiKey = (typeof API_KEYS)[number];
type ApiForm = Record<ApiKey, string>;

const EMPTY_FORM: ApiForm = {
  google_client_id: '',
  google_client_secret: '',
  gtm_container_id: '',
  ga4_measurement_id: '',
  cookie_consent: '',
};

function valueToString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function toMap(settings?: SiteSetting[]) {
  const map = new Map<string, SiteSetting>();
  if (settings) for (const s of settings) map.set(s.key, s);
  return map;
}

function tryParseJsonOrString(input: string): SettingValue {
  const s = String(input ?? '').trim();
  if (!s) return '' as any; // boş => backend tarafında default/empty davranışın ne ise
  try {
    return JSON.parse(s) as any;
  } catch {
    return s as any;
  }
}

export const ApiSettingsTab: React.FC<ApiSettingsTabProps> = ({ locale }) => {
  const {
    data: settings,
    isLoading,
    isFetching,
    refetch,
  } = useListSiteSettingsAdminQuery({
    keys: API_KEYS as unknown as string[],
    locale: '*', // ✅ KRİTİK: global settings'leri kesin getir
  });

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();

  const [form, setForm] = React.useState<ApiForm>(EMPTY_FORM);

  React.useEffect(() => {
    const map = toMap(settings);
    const next: ApiForm = { ...EMPTY_FORM };
    API_KEYS.forEach((k) => {
      next[k] = valueToString(map.get(k)?.value);
    });
    setForm(next);
  }, [settings]);

  const loading = isLoading || isFetching;
  const busy = loading || isSaving;

  const handleChange = (field: ApiKey, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    try {
      const updates: { key: ApiKey; value: SettingValue }[] = [
        { key: 'google_client_id', value: form.google_client_id.trim() },
        { key: 'google_client_secret', value: form.google_client_secret.trim() },
        { key: 'gtm_container_id', value: form.gtm_container_id.trim() },
        { key: 'ga4_measurement_id', value: form.ga4_measurement_id.trim() },
        { key: 'cookie_consent', value: tryParseJsonOrString(form.cookie_consent) },
      ];

      for (const u of updates) {
        // Not: Eğer mutation typings locale almıyorsa, locale alanını kaldır.
        await updateSetting({ key: u.key, value: u.value, locale: '*' } as any).unwrap();
      }

      toast.success('API & entegrasyon ayarları kaydedildi.');
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message || err?.message || 'API ayarları kaydedilirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  return (
    <div className="card">
      <div className="card-header py-2 d-flex justify-content-between align-items-center">
        <div className="d-flex flex-column">
          <span className="small fw-semibold">API & Entegrasyon Ayarları</span>
          <span className="text-muted small">
            Global ayarlardır (locale=`*`). Seçili dil sadece arayüz bilgisidir.
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-dark border">
            Global (locale=`*`) • Seçili dil: {locale || '—'}
          </span>
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

      <div className="card-body">
        {busy && (
          <div className="mb-2">
            <span className="badge bg-secondary">Yükleniyor...</span>
          </div>
        )}

        <p className="text-muted small mb-3">
          Bu alanlar genellikle dillere göre değişmez. Veritabanında <code>locale=`*`</code> olarak
          tutulur.
        </p>

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label small">
              Google Client ID (<code>google_client_id</code>)
            </label>
            <Input
              value={form.google_client_id}
              onChange={(e) => handleChange('google_client_id', e.target.value)}
              placeholder="Google OAuth Client ID"
              disabled={busy}
            />
            <div className="form-text small">Google OAuth / Login entegrasyonu için Client ID.</div>
          </div>

          <div className="col-md-6">
            <label className="form-label small">
              Google Client Secret (<code>google_client_secret</code>)
            </label>
            <Input
              type="password"
              value={form.google_client_secret}
              onChange={(e) => handleChange('google_client_secret', e.target.value)}
              placeholder="Google OAuth Client Secret"
              disabled={busy}
            />
            <div className="form-text small">
              Güvenlik nedeniyle mümkünse sadece backend ortam değişkenleriyle yönet.
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label small">
              GTM Container ID (<code>gtm_container_id</code>)
            </label>
            <Input
              value={form.gtm_container_id}
              onChange={(e) => handleChange('gtm_container_id', e.target.value)}
              placeholder="GTM-XXXXXXX"
              disabled={busy}
            />
            <div className="form-text small">
              GTM aktifse frontend sadece GTM scriptini basar; GA4 tag’i GTM içinden yönetilir.
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label small">
              GA4 Measurement ID (<code>ga4_measurement_id</code>)
            </label>
            <Input
              value={form.ga4_measurement_id}
              onChange={(e) => handleChange('ga4_measurement_id', e.target.value)}
              placeholder="G-XXXXXXXXXX"
              disabled={busy}
            />
            <div className="form-text small">
              GTM yoksa gtag.js ile fallback olarak kullanılabilir.
            </div>
          </div>

          <div className="col-12">
            <label className="form-label small">
              Cookie Consent (<code>cookie_consent</code>) (JSON)
            </label>
            <textarea
              className="form-control"
              rows={10}
              value={form.cookie_consent}
              onChange={(e) => handleChange('cookie_consent', e.target.value)}
              placeholder='{"consent_version":1,"defaults":{"necessary":true,"analytics":false,"marketing":false},"ui":{"enabled":true}}'
              disabled={busy}
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              }}
            />
            <div className="form-text small">
              JSON girersen obje olarak saklanır. Düz metin girersen string olarak saklanır.
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end mt-3">
          <Button type="button" variant="default" disabled={busy} onClick={handleSave}>
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </div>
  );
};
