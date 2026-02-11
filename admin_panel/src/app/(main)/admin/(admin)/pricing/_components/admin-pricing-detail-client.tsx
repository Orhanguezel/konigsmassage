'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/pricing/admin-pricing-detail-client.tsx
// FINAL — Admin Pricing Create/Edit
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { AdminJsonEditor } from '@/app/(main)/admin/_components/common/AdminJsonEditor';
import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';

import type { PricingPlanAdmin, UpsertPricingPlanInput } from '@/integrations/shared';
import { isUuidLike } from '@/integrations/shared';
import {
  useGetPricingPlanAdminQuery,
  useCreatePricingPlanAdminMutation,
  useUpdatePricingPlanAdminMutation,
} from '@/integrations/hooks';

type FormState = UpsertPricingPlanInput & { id?: string };

const emptyForm: FormState = {
  code: '',
  price_amount: '',
  price_unit: 'month',
  currency: 'EUR',
  is_active: true,
  is_featured: false,
  display_order: 0,
  cta_href: '',
  i18n: [],
};

export default function AdminPricingDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { copy } = useAdminUiCopy();
  const page = copy.pages?.pricing_detail ?? {};
  const common = copy.common;

  const isCreate = String(id) === 'new';
  const canLoad = !isCreate && isUuidLike(id);

  const planQ = useGetPricingPlanAdminQuery(id, { skip: !canLoad, refetchOnMountOrArgChange: true });
  const [createPlan, createState] = useCreatePricingPlanAdminMutation();
  const [updatePlan, updateState] = useUpdatePricingPlanAdminMutation();

  const [form, setForm] = React.useState<FormState>(emptyForm);

  React.useEffect(() => {
    if (planQ.data) {
      const plan = planQ.data as PricingPlanAdmin;
      setForm({
        id: plan.id,
        code: plan.code,
        price_amount: plan.price_amount,
        price_unit: plan.price_unit,
        currency: plan.currency,
        is_active: plan.is_active,
        is_featured: plan.is_featured,
        display_order: plan.display_order,
        cta_href: plan.cta_href ?? '',
        i18n: plan.i18n ?? [],
      });
    }
    if (isCreate) setForm({ ...emptyForm });
  }, [planQ.data, isCreate]);

  async function onSave() {
    if (!form.code.trim()) {
      toast.error(page?.code_required || '');
      return;
    }
    if (!form.i18n || form.i18n.length === 0) {
      toast.error(page?.i18n_required || '');
      return;
    }

    try {
      const payload: UpsertPricingPlanInput = {
        code: form.code.trim(),
        price_amount: form.price_amount,
        price_unit: form.price_unit ?? 'month',
        currency: form.currency ?? 'EUR',
        is_active: !!form.is_active,
        is_featured: !!form.is_featured,
        display_order: Number(form.display_order ?? 0),
        cta_href: form.cta_href?.trim() || null,
        i18n: Array.isArray(form.i18n) ? form.i18n : [],
      };

      if (isCreate) {
        const created = await createPlan(payload).unwrap();
        if (created?.id) {
          toast.success(common?.actions?.save || '');
          router.replace(`/admin/pricing/${encodeURIComponent(created.id)}`);
          return;
        }
      } else if (form.id) {
        await updatePlan({ id: form.id, patch: payload }).unwrap();
        toast.success(common?.actions?.save || '');
      }
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/pricing')}>
            {common?.actions?.back}
          </Button>
          <Button onClick={onSave} disabled={createState.isLoading || updateState.isLoading}>
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
            <div className="space-y-2">
              <Label>{page?.code_label}</Label>
              <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{page?.currency_label}</Label>
              <Input value={form.currency ?? ''} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{page?.price_amount_label}</Label>
              <Input
                type="number"
                value={form.price_amount ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, price_amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{page?.price_unit_label}</Label>
              <Input value={form.price_unit ?? ''} onChange={(e) => setForm((p) => ({ ...p, price_unit: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{page?.cta_href_label}</Label>
              <Input value={form.cta_href ?? ''} onChange={(e) => setForm((p) => ({ ...p, cta_href: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{page?.order_label}</Label>
              <Input
                type="number"
                value={form.display_order ?? 0}
                onChange={(e) => setForm((p) => ({ ...p, display_order: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={!!form.is_active} onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))} />
              <Label>{page?.active_label}</Label>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={!!form.is_featured} onCheckedChange={(v) => setForm((p) => ({ ...p, is_featured: v }))} />
              <Label>{page?.featured_label}</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="text-base">{page?.i18n_title}</CardTitle>
            <CardDescription>{page?.i18n_desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminJsonEditor
              label={page?.i18n_label}
              value={form.i18n ?? []}
              onChange={(next) => setForm((p) => ({ ...p, i18n: Array.isArray(next) ? next : [] }))}
              helperText={page?.i18n_help}
              height={320}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
