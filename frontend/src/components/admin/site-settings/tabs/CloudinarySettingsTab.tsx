// =============================================================
// FILE: src/components/admin/site-settings/tabs/CloudinarySettingsTab.tsx
// Cloudinary / Storage Ayarları Tab (GLOBAL) – style aligned
// =============================================================

import React from 'react';
import { toast } from 'sonner';

import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
  useLazyDiagCloudinaryAdminQuery,
} from '@/integrations/rtk/hooks';

import type { SiteSetting } from '@/integrations/types';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export type CloudinarySettingsTabProps = {
  locale: string; // UI badge için dursun
};

const STORAGE_KEYS = [
  'storage_driver',
  'storage_local_root',
  'storage_local_base_url',
  'storage_cdn_public_base',
  'storage_public_api_base',
  'cloudinary_cloud_name',
  'cloudinary_api_key',
  'cloudinary_api_secret',
  'cloudinary_folder',
  'cloudinary_unsigned_preset',
] as const;

type StorageKey = (typeof STORAGE_KEYS)[number];
type StorageForm = Record<StorageKey, string>;

const EMPTY_FORM: StorageForm = {
  storage_driver: '',
  storage_local_root: '',
  storage_local_base_url: '',
  storage_cdn_public_base: '',
  storage_public_api_base: '',
  cloudinary_cloud_name: '',
  cloudinary_api_key: '',
  cloudinary_api_secret: '',
  cloudinary_folder: '',
  cloudinary_unsigned_preset: '',
};

function valueToString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function toMap(settings?: SiteSetting[]) {
  const map = new Map<string, SiteSetting>();
  if (settings) for (const s of settings) map.set(s.key, s);
  return map;
}

export const CloudinarySettingsTab: React.FC<CloudinarySettingsTabProps> = ({ locale }) => {
  const {
    data: settings,
    isLoading,
    isFetching,
    refetch,
  } = useListSiteSettingsAdminQuery({
    keys: STORAGE_KEYS as unknown as string[],
    // GLOBAL => locale yok
  });

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();

  const [runDiag, { data: diagResult, isFetching: isTesting, error: diagError }] =
    useLazyDiagCloudinaryAdminQuery();

  const [form, setForm] = React.useState<StorageForm>(EMPTY_FORM);

  React.useEffect(() => {
    const map = toMap(settings);
    const next: StorageForm = { ...EMPTY_FORM };
    STORAGE_KEYS.forEach((k) => (next[k] = valueToString(map.get(k)?.value)));
    setForm(next);
  }, [settings]);

  const loading = isLoading || isFetching;
  const busy = loading || isSaving || isTesting;

  const handleChange = (field: StorageKey, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      for (const key of STORAGE_KEYS) {
        await updateSetting({ key, value: form[key].trim() }).unwrap();
      }
      toast.success('Cloudinary / Storage ayarları kaydedildi.');
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message || err?.message || 'Storage ayarları kaydedilirken hata oluştu.';
      toast.error(msg);
    }
  };

  const handleTest = async () => {
    try {
      const res = await runDiag().unwrap();
      if (res?.ok) {
        toast.success(
          `Cloudinary bağlantısı başarılı. Cloud: ${res.cloud}, test dosyası: ${res.uploaded?.public_id}`,
        );
      } else {
        toast.error("Cloudinary testi başarısız. Detaylar için console'a bak.");
        console.error('Cloudinary diag (unexpected response):', res);
      }
    } catch (err: any) {
      console.error('Cloudinary diag error:', err);

      const status = err?.status;
      const data = err?.data as any;

      if (status === 501) {
        const reason = data?.reason;
        if (reason === 'driver_is_local') {
          toast.error(
            "Cloudinary testi başarısız: storage_driver şu an 'local'. Cloudinary kullanmak için storage_driver'ı 'cloudinary' yap ve keyleri doldur.",
          );
        } else {
          toast.error(
            'Cloudinary yapılandırılmamış: Cloud name, API key ve secret değerlerini doldurup tekrar dene.',
          );
        }
        return;
      }

      if (status === 502) {
        const step = data?.step;
        const msg =
          data?.error?.msg ||
          data?.error?.message ||
          data?.message ||
          err?.message ||
          'Cloudinary testi başarısız.';
        toast.error(`Cloudinary testi başarısız (${step || 'unknown'}): ${msg}`);
        return;
      }

      const fallbackMsg =
        data?.error?.msg ||
        data?.error?.message ||
        data?.message ||
        err?.message ||
        'Cloudinary testi başarısız.';
      toast.error(fallbackMsg);
    }
  };

  const lastTestInfo = React.useMemo(() => {
    if (isTesting) return 'Cloudinary testi yapılıyor...';
    if (diagResult?.ok) return `Son test: BAŞARILI (cloud: ${diagResult.cloud})`;
    if (diagError) return 'Son test: HATA – detaylar için loglara bak.';
    return 'Cloudinary bağlantısını test etmek için "Cloudinary Test" butonuna tıkla.';
  }, [isTesting, diagResult, diagError]);

  return (
    <div className="card">
      <div className="card-header py-2 d-flex justify-content-between align-items-center">
        <div className="d-flex flex-column">
          <span className="small fw-semibold">Cloudinary / Storage Ayarları</span>
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
            onClick={refetch}
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

        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label small">Storage Driver</label>
            <Input
              value={form.storage_driver}
              onChange={(e) => handleChange('storage_driver', e.target.value)}
              placeholder="local veya cloudinary"
              disabled={busy}
            />
            <div className="form-text small">
              Örn: <code>cloudinary</code> veya <code>local</code>
            </div>
          </div>

          <div className="col-md-4">
            <label className="form-label small">Local Root</label>
            <Input
              value={form.storage_local_root}
              onChange={(e) => handleChange('storage_local_root', e.target.value)}
              placeholder="/var/www/uploads"
              disabled={busy}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label small">Local Base URL</label>
            <Input
              value={form.storage_local_base_url}
              onChange={(e) => handleChange('storage_local_base_url', e.target.value)}
              placeholder="/uploads veya https://cdn.site.com/uploads"
              disabled={busy}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label small">CDN Public Base</label>
            <Input
              value={form.storage_cdn_public_base}
              onChange={(e) => handleChange('storage_cdn_public_base', e.target.value)}
              placeholder="https://cdn.konigsmassage.com"
              disabled={busy}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label small">Public API Base</label>
            <Input
              value={form.storage_public_api_base}
              onChange={(e) => handleChange('storage_public_api_base', e.target.value)}
              placeholder="https://api.konigsmassage.com"
              disabled={busy}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label small">Cloudinary Cloud Name</label>
            <Input
              value={form.cloudinary_cloud_name}
              onChange={(e) => handleChange('cloudinary_cloud_name', e.target.value)}
              placeholder="cloud-name"
              disabled={busy}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label small">Cloudinary API Key</label>
            <Input
              value={form.cloudinary_api_key}
              onChange={(e) => handleChange('cloudinary_api_key', e.target.value)}
              placeholder="API key"
              disabled={busy}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label small">Cloudinary API Secret</label>
            <Input
              value={form.cloudinary_api_secret}
              onChange={(e) => handleChange('cloudinary_api_secret', e.target.value)}
              placeholder="API secret"
              disabled={busy}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label small">Cloudinary Folder</label>
            <Input
              value={form.cloudinary_folder}
              onChange={(e) => handleChange('cloudinary_folder', e.target.value)}
              placeholder="uploads"
              disabled={busy}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label small">Cloudinary Unsigned Preset</label>
            <Input
              value={form.cloudinary_unsigned_preset}
              onChange={(e) => handleChange('cloudinary_unsigned_preset', e.target.value)}
              placeholder="İsteğe bağlı preset adı"
              disabled={busy}
            />
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="small text-muted">{lastTestInfo}</div>

          <div className="d-flex gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={handleTest}>
              {isTesting ? 'Test ediliyor...' : 'Cloudinary Test'}
            </Button>
            <Button type="button" variant="default" disabled={busy} onClick={handleSave}>
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
