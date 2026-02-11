'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/resume/admin-resume-detail-client.tsx
// FINAL — Admin Resume Create/Edit
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
import { AdminLocaleSelect } from '@/app/(main)/admin/_components/common/AdminLocaleSelect';
import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';

import type { ResumeMerged, ResumeType, UpsertResumeInput } from '@/integrations/shared';
import { isUuidLike } from '@/integrations/shared';
import {
  useGetResumeAdminQuery,
  useCreateResumeAdminMutation,
  useUpdateResumeAdminMutation,
} from '@/integrations/hooks';

type FormState = UpsertResumeInput & { id?: string };

const emptyForm: FormState = {
  type: 'experience',
  is_active: true,
  display_order: 0,
  start_date: '',
  end_date: '',
  is_current: false,
  location: '',
  organization: '',
  score_value: '',
  score_scale: 100,
  locale: '',
  title: '',
  subtitle: '',
  description: '',
  highlights: [],
  slug: '',
};

export default function AdminResumeDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { copy } = useAdminUiCopy();
  const page = copy.pages?.resume_detail ?? {};
  const common = copy.common;

  const { localeOptions, defaultLocaleFromDb, loading: localesLoading } = useAdminLocales();

  const isCreate = String(id) === 'new';
  const canLoad = !isCreate && isUuidLike(id);

  const resumeQ = useGetResumeAdminQuery(
    { id, locale: undefined },
    { skip: !canLoad, refetchOnMountOrArgChange: true },
  );

  const [createItem, createState] = useCreateResumeAdminMutation();
  const [updateItem, updateState] = useUpdateResumeAdminMutation();

  const [form, setForm] = React.useState<FormState>(emptyForm);

  React.useEffect(() => {
    if (resumeQ.data) {
      const item = resumeQ.data as ResumeMerged;
      setForm({
        id: item.id,
        type: item.type,
        is_active: item.is_active,
        display_order: item.display_order,
        start_date: item.start_date ?? '',
        end_date: item.end_date ?? '',
        is_current: item.is_current,
        location: item.location ?? '',
        organization: item.organization ?? '',
        score_value: item.score_value ?? '',
        score_scale: item.score_scale ?? 100,
        locale: item.locale ?? '',
        title: item.title ?? '',
        subtitle: item.subtitle ?? '',
        description: item.description ?? '',
        highlights: item.highlights ?? [],
        slug: item.slug ?? '',
      });
    }
    if (isCreate) setForm({ ...emptyForm, locale: defaultLocaleFromDb || '' });
  }, [resumeQ.data, isCreate, defaultLocaleFromDb]);

  async function onSave() {
    if (!form.title.trim() || !form.slug.trim()) {
      toast.error(page?.required_error || '');
      return;
    }

    const payload: UpsertResumeInput = {
      type: form.type as ResumeType,
      is_active: !!form.is_active,
      display_order: Number(form.display_order ?? 0),
      start_date: form.start_date,
      end_date: form.end_date || undefined,
      is_current: !!form.is_current,
      location: form.location?.trim() || undefined,
      organization: form.organization?.trim() || undefined,
      score_value: form.score_value ?? undefined,
      score_scale: Number(form.score_scale ?? 100),
      locale: form.locale || undefined,
      title: form.title.trim(),
      subtitle: form.subtitle?.trim() || '',
      description: form.description?.trim() || '',
      highlights: Array.isArray(form.highlights) ? form.highlights : [],
      slug: form.slug.trim(),
    };

    try {
      if (isCreate) {
        const created = await createItem(payload).unwrap();
        if (created?.id) {
          toast.success(common?.actions?.save || '');
          router.replace(`/admin/resume/${encodeURIComponent(created.id)}`);
          return;
        }
      } else if (form.id) {
        await updateItem({ id: form.id, body: payload }).unwrap();
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
          <Button variant="outline" onClick={() => router.push('/admin/resume')}>
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
            <AdminLocaleSelect
              value={form.locale || ''}
              onChange={(v) => setForm((p) => ({ ...p, locale: v }))}
              options={localeOptions}
              loading={localesLoading}
              label={page?.locale_label}
            />

            <div className="space-y-2">
              <Label>{page?.type_label}</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((p) => ({ ...p, type: v as ResumeType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="education">{page?.type_education}</SelectItem>
                  <SelectItem value="experience">{page?.type_experience}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{page?.title_label}</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{page?.subtitle_label}</Label>
              <Input value={form.subtitle ?? ''} onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{page?.slug_label}</Label>
              <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{page?.description_label}</Label>
              <Textarea value={form.description ?? ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="text-base">{page?.meta_title}</CardTitle>
            <CardDescription>{page?.meta_desc}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={!!form.is_active} onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))} />
              <Label>{page?.active_label}</Label>
            </div>

            <div className="space-y-2">
              <Label>{page?.order_label}</Label>
              <Input type="number" value={form.display_order ?? 0} onChange={(e) => setForm((p) => ({ ...p, display_order: Number(e.target.value) }))} />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{page?.start_date_label}</Label>
                <Input type="date" value={form.start_date ?? ''} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{page?.end_date_label}</Label>
                <Input type="date" value={form.end_date ?? ''} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={!!form.is_current} onCheckedChange={(v) => setForm((p) => ({ ...p, is_current: v }))} />
              <Label>{page?.current_label}</Label>
            </div>

            <div className="space-y-2">
              <Label>{page?.location_label}</Label>
              <Input value={form.location ?? ''} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{page?.organization_label}</Label>
              <Input value={form.organization ?? ''} onChange={(e) => setForm((p) => ({ ...p, organization: e.target.value }))} />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{page?.score_value_label}</Label>
                <Input value={form.score_value ?? ''} onChange={(e) => setForm((p) => ({ ...p, score_value: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{page?.score_scale_label}</Label>
                <Input type="number" value={form.score_scale ?? 100} onChange={(e) => setForm((p) => ({ ...p, score_scale: Number(e.target.value) }))} />
              </div>
            </div>

            <AdminJsonEditor
              label={page?.highlights_label}
              value={form.highlights ?? []}
              onChange={(next) => setForm((p) => ({ ...p, highlights: Array.isArray(next) ? next : [] }))}
              helperText={page?.highlights_help}
              height={220}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
