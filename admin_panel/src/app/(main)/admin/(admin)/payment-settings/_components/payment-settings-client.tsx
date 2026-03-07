'use client';

// =============================================================
// FILE: payment-settings/_components/payment-settings-client.tsx
// Standalone Payment Settings page — PayPal + Bank Transfer
// ✅ i18n via useAdminT
// =============================================================

import React from 'react';
import { toast } from 'sonner';
import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/hooks';
import type { SettingValue } from '@/integrations/shared';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAYMENT_KEYS = [
  'booking_payment_enabled',
  'paypal_enabled',
  'paypal_mode',
  'paypal_client_id',
  'paypal_client_secret',
  'paypal_webhook_id',
  'bank_transfer_enabled',
  'bank_account_name',
  'bank_iban',
  'bank_name',
  'bank_branch',
  'bank_swift',
] as const;

type PaymentKey = (typeof PAYMENT_KEYS)[number];

type PaymentForm = {
  booking_payment_enabled: boolean;
  paypal_enabled: boolean;
  paypal_mode: 'sandbox' | 'production';
  paypal_client_id: string;
  paypal_client_secret: string;
  paypal_webhook_id: string;
  bank_transfer_enabled: boolean;
  bank_account_name: string;
  bank_iban: string;
  bank_name: string;
  bank_branch: string;
  bank_swift: string;
};

const EMPTY_FORM: PaymentForm = {
  booking_payment_enabled: false,
  paypal_enabled: false,
  paypal_mode: 'sandbox',
  paypal_client_id: '',
  paypal_client_secret: '',
  paypal_webhook_id: '',
  bank_transfer_enabled: false,
  bank_account_name: '',
  bank_iban: '',
  bank_name: '',
  bank_branch: '',
  bank_swift: '',
};

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

function toStr(v: unknown): string {
  return v === null || v === undefined ? '' : String(v);
}

function toMap(settings?: any) {
  const map = new Map<string, any>();
  if (settings) for (const s of settings) map.set(s.key, s);
  return map;
}

export function PaymentSettingsClient() {
  const t = useAdminT('admin.siteSettings.payment');

  const {
    data: settings,
    isLoading,
    isFetching,
    refetch,
  } = useListSiteSettingsAdminQuery({
    keys: PAYMENT_KEYS as unknown as string[],
  });

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const [form, setForm] = React.useState<PaymentForm>(EMPTY_FORM);

  React.useEffect(() => {
    const map = toMap(settings);
    setForm({
      booking_payment_enabled: toBool(map.get('booking_payment_enabled')?.value),
      paypal_enabled: toBool(map.get('paypal_enabled')?.value),
      paypal_mode: (toStr(map.get('paypal_mode')?.value) || 'sandbox') as 'sandbox' | 'production',
      paypal_client_id: toStr(map.get('paypal_client_id')?.value),
      paypal_client_secret: toStr(map.get('paypal_client_secret')?.value),
      paypal_webhook_id: toStr(map.get('paypal_webhook_id')?.value),
      bank_transfer_enabled: toBool(map.get('bank_transfer_enabled')?.value),
      bank_account_name: toStr(map.get('bank_account_name')?.value),
      bank_iban: toStr(map.get('bank_iban')?.value),
      bank_name: toStr(map.get('bank_name')?.value),
      bank_branch: toStr(map.get('bank_branch')?.value),
      bank_swift: toStr(map.get('bank_swift')?.value),
    });
  }, [settings]);

  const loading = isLoading || isFetching;
  const busy = loading || isSaving;

  const set = <K extends keyof PaymentForm>(key: K, value: PaymentForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      const updates: { key: PaymentKey; value: SettingValue }[] = [
        { key: 'booking_payment_enabled', value: form.booking_payment_enabled ? 'true' : 'false' },
        { key: 'paypal_enabled', value: form.paypal_enabled },
        { key: 'paypal_mode', value: form.paypal_mode },
        { key: 'paypal_client_id', value: form.paypal_client_id.trim() },
        { key: 'paypal_client_secret', value: form.paypal_client_secret },
        { key: 'paypal_webhook_id', value: form.paypal_webhook_id.trim() },
        { key: 'bank_transfer_enabled', value: form.bank_transfer_enabled },
        { key: 'bank_account_name', value: form.bank_account_name.trim() },
        { key: 'bank_iban', value: form.bank_iban.trim() },
        { key: 'bank_name', value: form.bank_name.trim() },
        { key: 'bank_branch', value: form.bank_branch.trim() },
        { key: 'bank_swift', value: form.bank_swift.trim() },
      ];

      for (const u of updates) {
        await updateSetting({ key: u.key, locale: '*', value: u.value }).unwrap();
      }

      toast.success(t('saved', {}, 'Payment settings saved.'));
      await refetch();
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || t('saveError', {}, 'Failed to save.');
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('title', {}, 'Payment Settings')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('description', {}, 'Configure PayPal and bank transfer.')}</p>
      </div>

      {/* Booking Online Payment Toggle */}
      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{t('bookingPayment.title', {}, 'Booking Online Payment')}</CardTitle>
              <CardDescription>{t('bookingPayment.description', {}, 'When enabled, customers receive a payment link in their booking confirmation email.')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="booking-payment-enabled"
              checked={form.booking_payment_enabled}
              onCheckedChange={(v) => set('booking_payment_enabled', v)}
              disabled={busy}
            />
            <Label htmlFor="booking-payment-enabled">
              {t('bookingPayment.enabled', {}, 'Enable online payment for bookings')}
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            {form.booking_payment_enabled
              ? t('bookingPayment.activeNote', {}, 'Active: Booking confirmation emails will include a payment link. The appointment page will show a "Pay" button after booking.')
              : t('bookingPayment.inactiveNote', {}, 'Inactive: Booking confirmation emails will only confirm the appointment without a payment link.')}
          </p>
        </CardContent>
      </Card>

      {/* PayPal */}
      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{t('paypal.title', {}, 'PayPal')}</CardTitle>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={refetch} disabled={busy}>
              Yenile
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {loading && <Badge variant="secondary">Yükleniyor...</Badge>}

          <div className="flex items-center gap-3">
            <Switch
              id="paypal-enabled"
              checked={form.paypal_enabled}
              onCheckedChange={(v) => set('paypal_enabled', v)}
              disabled={busy}
            />
            <Label htmlFor="paypal-enabled">{t('paypal.enabled', {}, 'Enable PayPal')}</Label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="space-y-2 md:col-span-4">
              <Label className="text-sm">{t('paypal.mode', {}, 'Mode')}</Label>
              <Select
                value={form.paypal_mode}
                onValueChange={(v) => set('paypal_mode', v as 'sandbox' | 'production')}
                disabled={busy}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">{t('paypal.modeSandbox', {}, 'Sandbox (Test)')}</SelectItem>
                  <SelectItem value="production">{t('paypal.modeProduction', {}, 'Live (Production)')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-8">
              <Label className="text-sm">{t('paypal.clientId', {}, 'Client ID')}</Label>
              <Input
                value={form.paypal_client_id}
                onChange={(e) => set('paypal_client_id', e.target.value)}
                placeholder={t('paypal.clientIdPh', {}, 'AXxxxx...')}
                disabled={busy}
              />
            </div>

            <div className="space-y-2 md:col-span-6">
              <Label className="text-sm">{t('paypal.clientSecret', {}, 'Client Secret')}</Label>
              <Input
                type="password"
                value={form.paypal_client_secret}
                onChange={(e) => set('paypal_client_secret', e.target.value)}
                placeholder={t('paypal.clientSecretPh', {}, 'ELxxxx...')}
                disabled={busy}
              />
            </div>

            <div className="space-y-2 md:col-span-6">
              <Label className="text-sm">{t('paypal.webhookId', {}, 'Webhook ID (optional)')}</Label>
              <Input
                value={form.paypal_webhook_id}
                onChange={(e) => set('paypal_webhook_id', e.target.value)}
                placeholder={t('paypal.webhookIdPh', {}, 'WH-xxxx...')}
                disabled={busy}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Transfer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('bankTransfer.title', {}, 'Bank Transfer')}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex items-center gap-3">
            <Switch
              id="bank-enabled"
              checked={form.bank_transfer_enabled}
              onCheckedChange={(v) => set('bank_transfer_enabled', v)}
              disabled={busy}
            />
            <Label htmlFor="bank-enabled">{t('bankTransfer.enabled', {}, 'Enable bank transfer')}</Label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="space-y-2 md:col-span-6">
              <Label className="text-sm">{t('bankTransfer.accountName', {}, 'Account holder')}</Label>
              <Input
                value={form.bank_account_name}
                onChange={(e) => set('bank_account_name', e.target.value)}
                placeholder={t('bankTransfer.accountNamePh', {}, 'Company Name')}
                disabled={busy}
              />
            </div>

            <div className="space-y-2 md:col-span-6">
              <Label className="text-sm">{t('bankTransfer.iban', {}, 'IBAN')}</Label>
              <Input
                value={form.bank_iban}
                onChange={(e) => set('bank_iban', e.target.value)}
                placeholder={t('bankTransfer.ibanPh', {}, 'DE89...')}
                disabled={busy}
              />
            </div>

            <div className="space-y-2 md:col-span-4">
              <Label className="text-sm">{t('bankTransfer.bankName', {}, 'Bank')}</Label>
              <Input
                value={form.bank_name}
                onChange={(e) => set('bank_name', e.target.value)}
                placeholder={t('bankTransfer.bankNamePh', {}, 'Deutsche Bank')}
                disabled={busy}
              />
            </div>

            <div className="space-y-2 md:col-span-4">
              <Label className="text-sm">{t('bankTransfer.branch', {}, 'Branch')}</Label>
              <Input
                value={form.bank_branch}
                onChange={(e) => set('bank_branch', e.target.value)}
                placeholder={t('bankTransfer.branchPh', {}, 'Frankfurt am Main')}
                disabled={busy}
              />
            </div>

            <div className="space-y-2 md:col-span-4">
              <Label className="text-sm">{t('bankTransfer.swift', {}, 'SWIFT / BIC')}</Label>
              <Input
                value={form.bank_swift}
                onChange={(e) => set('bank_swift', e.target.value)}
                placeholder={t('bankTransfer.swiftPh', {}, 'DEUTDEDBXXX')}
                disabled={busy}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button type="button" disabled={busy} onClick={handleSave}>
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </div>
  );
}
