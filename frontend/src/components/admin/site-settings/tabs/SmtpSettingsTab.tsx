// =============================================================
// FILE: src/components/admin/site-settings/tabs/SmtpSettingsTab.tsx
// SMTP / E-posta Ayarları Tab (GLOBAL) – style aligned
// =============================================================

import React from 'react';
import { toast } from 'sonner';
import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
  useSendTestMailMutation,
} from '@/integrations/rtk/hooks';

import type { SettingValue, SiteSetting } from '@/integrations/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export type SmtpSettingsTabProps = {
  locale: string; // UI badge için dursun, GLOBAL tab
};

const SMTP_KEYS = [
  'smtp_host',
  'smtp_port',
  'smtp_username',
  'smtp_password',
  'smtp_from_email',
  'smtp_from_name',
  'smtp_ssl',
] as const;

type SmtpKey = (typeof SMTP_KEYS)[number];

type SmtpForm = {
  smtp_host: string;
  smtp_port: string;
  smtp_username: string;
  smtp_password: string;
  smtp_from_email: string;
  smtp_from_name: string;
  smtp_ssl: boolean;
};

const EMPTY_FORM: SmtpForm = {
  smtp_host: '',
  smtp_port: '',
  smtp_username: '',
  smtp_password: '',
  smtp_from_email: '',
  smtp_from_name: '',
  smtp_ssl: false,
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

function toBool(v: unknown): boolean {
  if (v === true) return true;
  if (v === false) return false;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') {
    const t = v.trim().toLowerCase();
    return t === '1' || t === 'true' || t === 'yes' || t === 'on';
  }
  return false;
}

function toMap(settings?: SiteSetting[] | undefined) {
  const map = new Map<string, SiteSetting>();
  if (settings) for (const s of settings) map.set(s.key, s);
  return map;
}

export const SmtpSettingsTab: React.FC<SmtpSettingsTabProps> = ({ locale }) => {
  const {
    data: settings,
    isLoading,
    isFetching,
    refetch,
  } = useListSiteSettingsAdminQuery({
    keys: SMTP_KEYS as unknown as string[],
    // GLOBAL => locale göndermiyoruz
  });

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const [sendTestMail, { isLoading: isTesting }] = useSendTestMailMutation();

  const [form, setForm] = React.useState<SmtpForm>(EMPTY_FORM);
  const [testEmail, setTestEmail] = React.useState<string>('');

  React.useEffect(() => {
    const map = toMap(settings);
    const next: SmtpForm = { ...EMPTY_FORM };

    next.smtp_host = valueToString(map.get('smtp_host')?.value);
    next.smtp_port = valueToString(map.get('smtp_port')?.value);
    next.smtp_username = valueToString(map.get('smtp_username')?.value);
    next.smtp_password = valueToString(map.get('smtp_password')?.value);
    next.smtp_from_email = valueToString(map.get('smtp_from_email')?.value);
    next.smtp_from_name = valueToString(map.get('smtp_from_name')?.value);
    next.smtp_ssl = toBool(map.get('smtp_ssl')?.value);

    setForm(next);
  }, [settings]);

  const loading = isLoading || isFetching;
  const busy = loading || isSaving || isTesting;

  const handleChange = (field: Exclude<SmtpKey, 'smtp_ssl'>, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleSsl = () => {
    setForm((prev) => ({ ...prev, smtp_ssl: !prev.smtp_ssl }));
  };

  const handleSave = async () => {
    try {
      const updates: { key: SmtpKey; value: SettingValue }[] = [
        { key: 'smtp_host', value: form.smtp_host.trim() },
        { key: 'smtp_port', value: form.smtp_port.trim() || '' },
        { key: 'smtp_username', value: form.smtp_username.trim() },
        { key: 'smtp_password', value: form.smtp_password },
        { key: 'smtp_from_email', value: form.smtp_from_email.trim() },
        { key: 'smtp_from_name', value: form.smtp_from_name.trim() },
        { key: 'smtp_ssl', value: form.smtp_ssl },
      ];

      for (const u of updates) {
        await updateSetting({ key: u.key, value: u.value }).unwrap();
      }

      toast.success('SMTP ayarları kaydedildi.');
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message || err?.message || 'SMTP ayarları kaydedilirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  const handleSendTest = async () => {
    try {
      const trimmedTest = testEmail.trim();
      const fromEmail = form.smtp_from_email.trim();

      if (trimmedTest) await sendTestMail({ to: trimmedTest }).unwrap();
      else if (fromEmail) await sendTestMail({ to: fromEmail }).unwrap();
      else await sendTestMail().unwrap();

      toast.success('Test e-postası gönderildi. Gelen kutunu (ve spam) kontrol et.');
    } catch (err: any) {
      const msg =
        err?.data?.error?.details ||
        err?.data?.error?.message ||
        err?.message ||
        'Test maili gönderilirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  return (
    <div className="card">
      <div className="card-header py-2 d-flex justify-content-between align-items-center">
        <div className="d-flex flex-column">
          <span className="small fw-semibold">SMTP / E-posta Ayarları</span>
          <span className="text-muted small">
            Bu ayarlar genellikle globaldir (locale=`*`). Seçili dil sadece arayüz bilgisidir.
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
          <div className="col-md-6">
            <label className="form-label small">SMTP Host</label>
            <Input
              value={form.smtp_host}
              onChange={(e) => handleChange('smtp_host', e.target.value)}
              placeholder="smtp.hostinger.com veya smtp.gmail.com"
              disabled={busy}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label small">SMTP Port</label>
            <Input
              value={form.smtp_port}
              onChange={(e) => handleChange('smtp_port', e.target.value)}
              placeholder="465 veya 587"
              disabled={busy}
            />
          </div>

          <div className="col-md-3 d-flex align-items-end">
            <div className="form-check">
              <input
                id="smtp-ssl"
                type="checkbox"
                className="form-check-input"
                checked={form.smtp_ssl}
                onChange={handleToggleSsl}
                disabled={busy}
              />
              <label htmlFor="smtp-ssl" className="form-check-label small">
                SSL etkin
              </label>
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label small">Kullanıcı Adı</label>
            <Input
              value={form.smtp_username}
              onChange={(e) => handleChange('smtp_username', e.target.value)}
              placeholder="SMTP kullanıcı adı"
              disabled={busy}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label small">Şifre</label>
            <Input
              type="password"
              value={form.smtp_password}
              onChange={(e) => handleChange('smtp_password', e.target.value)}
              placeholder="••••••••"
              disabled={busy}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label small">Gönderen E-posta</label>
            <Input
              value={form.smtp_from_email}
              onChange={(e) => handleChange('smtp_from_email', e.target.value)}
              placeholder="no-reply@konigsmassage.com"
              disabled={busy}
            />
            <div className="form-text small">Uygulamadaki e-postalar bu adresten gönderilir.</div>
          </div>

          <div className="col-md-6">
            <label className="form-label small">Gönderen İsim</label>
            <Input
              value={form.smtp_from_name}
              onChange={(e) => handleChange('smtp_from_name', e.target.value)}
              placeholder="konigsmassage"
              disabled={busy}
            />
          </div>
        </div>

        <hr className="my-4" />

        <div className="row g-3 align-items-end">
          <div className="col-md-6">
            <label className="form-label small">Test mail alıcısı</label>
            <Input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="ornek@ornek.com"
              disabled={busy}
            />
            <div className="form-text small">
              Dolu ise test maili buraya gider. Boşsa önce gönderen e-posta, o da yoksa giriş yapan
              kullanıcının e-postası kullanılır.
            </div>
          </div>

          <div className="col-md-6 d-flex justify-content-md-end gap-2 mt-3 mt-md-0">
            <Button type="button" variant="outline" disabled={busy} onClick={handleSendTest}>
              {isTesting ? 'Test maili gönderiliyor...' : 'Test mail gönder'}
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
