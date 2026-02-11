'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/offers/admin-offer-detail-client.tsx
// FINAL — Admin Offer Create/Edit
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { AdminJsonEditor } from '@/app/(main)/admin/_components/common/AdminJsonEditor';
import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';

import type { OfferAdminUpsertBody, OfferStatus, OfferView } from '@/integrations/shared';
import { isUuidLike } from '@/integrations/shared';
import {
  useGetOfferAdminQuery,
  useCreateOfferAdminMutation,
  useUpdateOfferAdminMutation,
  useGenerateOfferPdfAdminMutation,
  useSendOfferEmailAdminMutation,
  useSendOfferAdminMutation,
} from '@/integrations/hooks';

type FormState = OfferAdminUpsertBody & { id?: string };

const emptyForm: FormState = {
  customer_name: '',
  company_name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  service_id: '',
  service_title: '',
  status: 'new',
  currency: 'TRY',
  net_total: null,
  vat_rate: null,
  vat_total: null,
  shipping_total: null,
  gross_total: null,
  offer_no: '',
  valid_until: '',
  admin_notes: '',
  form_data: undefined,
  consent_marketing: false,
  consent_terms: false,
};

export default function AdminOfferDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { copy } = useAdminUiCopy();
  const page = copy.pages?.offers_detail ?? {};
  const common = copy.common;

  const isCreate = String(id) === 'new';
  const canLoad = !isCreate && isUuidLike(id);

  const offerQ = useGetOfferAdminQuery(
    { id },
    { skip: !canLoad, refetchOnMountOrArgChange: true },
  );

  const [createOffer, createState] = useCreateOfferAdminMutation();
  const [updateOffer, updateState] = useUpdateOfferAdminMutation();

  const [genPdf, genPdfState] = useGenerateOfferPdfAdminMutation();
  const [sendEmail, sendEmailState] = useSendOfferEmailAdminMutation();
  const [sendAll, sendAllState] = useSendOfferAdminMutation();

  const loading = offerQ.isFetching || createState.isLoading || updateState.isLoading;

  const [form, setForm] = React.useState<FormState>(emptyForm);

  React.useEffect(() => {
    if (offerQ.data) {
      const v = offerQ.data as OfferView;
      setForm({
        id: v.id,
        customer_name: v.customer_name,
        company_name: v.company_name ?? '',
        email: v.email,
        phone: v.phone ?? '',
        subject: v.subject ?? '',
        message: v.message ?? '',
        service_id: v.service_id ?? '',
        service_title: v.service_title ?? '',
        status: v.status,
        currency: v.currency ?? 'TRY',
        net_total: v.net_total ?? null,
        vat_rate: v.vat_rate ?? null,
        vat_total: v.vat_total ?? null,
        shipping_total: v.shipping_total ?? null,
        gross_total: v.gross_total ?? null,
        offer_no: v.offer_no ?? '',
        valid_until: v.valid_until ?? '',
        admin_notes: v.admin_notes ?? '',
        form_data: v.form_data ?? undefined,
        consent_marketing: v.consent_marketing ?? false,
        consent_terms: v.consent_terms ?? false,
      });
    } else if (isCreate) {
      setForm({ ...emptyForm });
    }
  }, [offerQ.data, isCreate]);

  async function onSave() {
    if (!form.customer_name.trim() || !form.email.trim()) {
      toast.error(page?.required_error || '');
      return;
    }

    try {
      const payload: OfferAdminUpsertBody = {
        customer_name: form.customer_name.trim(),
        company_name: form.company_name?.trim() || null,
        email: form.email.trim(),
        phone: form.phone?.trim() || undefined,
        subject: form.subject?.trim() || undefined,
        message: form.message?.trim() || undefined,
        service_id: form.service_id?.trim() || undefined,
        service_title: form.service_title?.trim() || undefined,
        status: form.status,
        currency: form.currency?.trim() || undefined,
        net_total: form.net_total ?? undefined,
        vat_rate: form.vat_rate ?? undefined,
        vat_total: form.vat_total ?? undefined,
        shipping_total: form.shipping_total ?? undefined,
        gross_total: form.gross_total ?? undefined,
        offer_no: form.offer_no?.trim() || undefined,
        valid_until: form.valid_until?.trim() || undefined,
        admin_notes: form.admin_notes?.trim() || undefined,
        form_data: form.form_data ?? undefined,
        consent_marketing: form.consent_marketing,
        consent_terms: form.consent_terms,
      };

      if (isCreate) {
        const created = await createOffer(payload).unwrap();
        if (created?.id) {
          toast.success(common?.actions?.save || '');
          router.replace(`/admin/offers/${encodeURIComponent(created.id)}`);
          return;
        }
      } else if (form.id) {
        await updateOffer({ id: form.id, body: payload }).unwrap();
        toast.success(common?.actions?.save || '');
      }
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || common?.states?.error || '');
    }
  }

  async function onPdf() {
    if (!form.id) return;
    try {
      await genPdf({ id: form.id, force: true }).unwrap();
      toast.success(page?.pdf_ok || '');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || common?.states?.error || '');
    }
  }

  async function onEmail() {
    if (!form.id) return;
    try {
      await sendEmail({ id: form.id, force: true }).unwrap();
      toast.success(page?.email_ok || '');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || common?.states?.error || '');
    }
  }

  async function onSendAll() {
    if (!form.id) return;
    try {
      await sendAll({ id: form.id, force: true }).unwrap();
      toast.success(page?.send_ok || '');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || common?.states?.error || '');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">
            {isCreate ? page?.create_title : page?.edit_title}
          </h1>
          <p className="text-sm text-muted-foreground">{page?.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/offers')}>
            {common?.actions?.back}
          </Button>
          <Button onClick={onSave} disabled={loading}>
            {common?.actions?.save}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="gap-2">
            <CardTitle className="text-base">{page?.form_title}</CardTitle>
            <CardDescription>{page?.form_desc}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>{page?.status_label}</Label>
              <Select
                value={form.status || 'new'}
                onValueChange={(v) => setForm((p) => ({ ...p, status: v as OfferStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{page?.status_new}</SelectItem>
                  <SelectItem value="in_review">{page?.status_in_review}</SelectItem>
                  <SelectItem value="quoted">{page?.status_quoted}</SelectItem>
                  <SelectItem value="sent">{page?.status_sent}</SelectItem>
                  <SelectItem value="accepted">{page?.status_accepted}</SelectItem>
                  <SelectItem value="rejected">{page?.status_rejected}</SelectItem>
                  <SelectItem value="cancelled">{page?.status_cancelled}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{page?.customer_label}</Label>
              <Input value={form.customer_name} onChange={(e) => setForm((p) => ({ ...p, customer_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{page?.company_label}</Label>
              <Input value={form.company_name ?? ''} onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{page?.email_label}</Label>
              <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{page?.phone_label}</Label>
              <Input value={form.phone ?? ''} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{page?.subject_label}</Label>
              <Input value={form.subject ?? ''} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{page?.message_label}</Label>
              <Textarea value={form.message ?? ''} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} rows={4} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="text-base">{page?.meta_title}</CardTitle>
            <CardDescription>{page?.meta_desc}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>{page?.service_id_label}</Label>
              <Input value={form.service_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, service_id: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{page?.service_title_label}</Label>
              <Input value={form.service_title ?? ''} onChange={(e) => setForm((p) => ({ ...p, service_title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{page?.currency_label}</Label>
              <Input value={form.currency ?? ''} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{page?.net_total_label}</Label>
                <Input type="number" value={form.net_total ?? ''} onChange={(e) => setForm((p) => ({ ...p, net_total: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div className="space-y-2">
                <Label>{page?.vat_rate_label}</Label>
                <Input type="number" value={form.vat_rate ?? ''} onChange={(e) => setForm((p) => ({ ...p, vat_rate: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div className="space-y-2">
                <Label>{page?.vat_total_label}</Label>
                <Input type="number" value={form.vat_total ?? ''} onChange={(e) => setForm((p) => ({ ...p, vat_total: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div className="space-y-2">
                <Label>{page?.shipping_total_label}</Label>
                <Input type="number" value={form.shipping_total ?? ''} onChange={(e) => setForm((p) => ({ ...p, shipping_total: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div className="space-y-2">
                <Label>{page?.gross_total_label}</Label>
                <Input type="number" value={form.gross_total ?? ''} onChange={(e) => setForm((p) => ({ ...p, gross_total: e.target.value ? Number(e.target.value) : null }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{page?.offer_no_label}</Label>
              <Input value={form.offer_no ?? ''} onChange={(e) => setForm((p) => ({ ...p, offer_no: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{page?.valid_until_label}</Label>
              <Input type="date" value={form.valid_until ?? ''} onChange={(e) => setForm((p) => ({ ...p, valid_until: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>{page?.admin_notes_label}</Label>
              <Textarea value={form.admin_notes ?? ''} onChange={(e) => setForm((p) => ({ ...p, admin_notes: e.target.value }))} rows={3} />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={!!form.consent_marketing} onCheckedChange={(v) => setForm((p) => ({ ...p, consent_marketing: v }))} />
              <Label>{page?.consent_marketing_label}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.consent_terms} onCheckedChange={(v) => setForm((p) => ({ ...p, consent_terms: v }))} />
              <Label>{page?.consent_terms_label}</Label>
            </div>

            <AdminJsonEditor
              label={page?.form_data_label}
              value={form.form_data ?? {}}
              onChange={(next) => setForm((p) => ({ ...p, form_data: next }))}
              helperText={page?.form_data_help}
            />
          </CardContent>
        </Card>
      </div>

      {!isCreate && form.id ? (
        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="text-base">{page?.actions_title}</CardTitle>
            <CardDescription>{page?.actions_desc}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onPdf} disabled={genPdfState.isLoading}>
              {page?.action_pdf}
            </Button>
            <Button variant="outline" onClick={onEmail} disabled={sendEmailState.isLoading}>
              {page?.action_email}
            </Button>
            <Button onClick={onSendAll} disabled={sendAllState.isLoading}>
              {page?.action_send}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
