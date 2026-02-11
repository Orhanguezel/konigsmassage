'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/skills/counters/[id]/admin-skill-counter-detail-client.tsx
// FINAL — Admin Skill Counter Create/Edit
// ✅ All TypeScript errors fixed
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { AdminLocaleSelect, type AdminLocaleOption } from '@/app/(main)/admin/_components/common/AdminLocaleSelect';
import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';

import type { SkillCounterMerged, CreateSkillCounterInput } from '@/integrations/shared';
import { isUuidLike } from '@/integrations/shared';
import {
  useListSkillCountersAdminQuery,
  useCreateSkillCounterAdminMutation,
  useUpdateSkillCounterAdminMutation,
  useRemoveSkillCounterAdminMutation,
} from '@/integrations/hooks';

type FormData = CreateSkillCounterInput & { id?: string };

const emptyForm: FormData = {
  percent: 0,
  image_url: '',
  image_asset_id: '',
  is_active: true,
  display_order: 0,
  locale: '',
  title: '',
  slug: '',
};

function getErrMsg(e: unknown): string {
  const anyErr = e as any;
  return (
    anyErr?.data?.error?.message ||
    anyErr?.data?.message ||
    anyErr?.message ||
    'İşlem başarısız'
  );
}

export default function AdminSkillCounterDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { copy } = useAdminUiCopy();
  const page = copy.pages?.skills ?? {};
  const common = copy.common;

  const { localeOptions, defaultLocaleFromDb, loading: localesLoading } = useAdminLocales();

  // ✅ Safe locale options
  const safeLocaleOptions: AdminLocaleOption[] = React.useMemo(() => {
    if (!Array.isArray(localeOptions)) return [];
    return localeOptions.map((opt) => ({
      value: opt.value || '',
      label: opt.label || opt.value || '',
    }));
  }, [localeOptions]);

  const isNew = id === 'new';
  const canLoad = !isNew && isUuidLike(id);

  // ✅ FIX: Use listSkillCountersAdminQuery to get all counters, then find the one we need
  const { data: allCounters, isLoading: loadingItem, error: loadError } = useListSkillCountersAdminQuery(
    { limit: 200 },
    { skip: !canLoad }
  );

  // ✅ FIX: Find the specific counter from the list
  const existingItem = React.useMemo(() => {
    if (!allCounters || isNew) return null;
    return allCounters.find((counter) => counter.id === id) || null;
  }, [allCounters, id, isNew]);

  const [createCounter, { isLoading: isCreating }] = useCreateSkillCounterAdminMutation();
  const [updateCounter, { isLoading: isUpdating }] = useUpdateSkillCounterAdminMutation();
  const [removeCounter, { isLoading: isDeleting }] = useRemoveSkillCounterAdminMutation();

  const [formData, setFormData] = React.useState<FormData>(() => ({
    ...emptyForm,
    locale: '',
  }));

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // Set initial locale
  React.useEffect(() => {
    if (!formData.locale && defaultLocaleFromDb) {
      setFormData((prev) => ({ ...prev, locale: defaultLocaleFromDb }));
    }
  }, [defaultLocaleFromDb, formData.locale]);

  // Load existing data
  React.useEffect(() => {
    if (!isNew && existingItem) {
      setFormData({
        id: existingItem.id,
        percent: existingItem.percent,
        image_url: existingItem.image_url ?? '',
        image_asset_id: existingItem.image_asset_id ?? '',
        is_active: existingItem.is_active,
        display_order: existingItem.display_order,
        locale: existingItem.locale,
        title: existingItem.title,
        slug: existingItem.slug,
      });
    }
  }, [existingItem, isNew]);

  const busy = isCreating || isUpdating || isDeleting || loadingItem;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.slug.trim()) {
      toast.error(page?.counter_required || 'Başlık ve slug gerekli');
      return;
    }

    try {
      const payload: CreateSkillCounterInput = {
        percent: Number(formData.percent),
        image_url: formData.image_url?.trim() || null,
        image_asset_id: formData.image_asset_id?.trim() || null,
        is_active: formData.is_active,
        display_order: Number(formData.display_order ?? 0),
        locale: formData.locale || undefined,
        title: formData.title.trim(),
        slug: formData.slug.trim(),
      };

      if (isNew) {
        await createCounter(payload).unwrap();
        toast.success('Kayıt oluşturuldu');
        router.push('/admin/skills?tab=counters');
      } else if (formData.id) {
        await updateCounter({ id: formData.id, patch: payload }).unwrap();
        toast.success('Kayıt güncellendi');
      }
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (isNew || !formData.id) return;

    try {
      await removeCounter({ id: formData.id }).unwrap();
      toast.success('Kayıt silindi');
      router.push('/admin/skills?tab=counters');
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  if (loadError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-destructive">
              Kayıt yüklenemedi: {getErrMsg(loadError)}
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/skills?tab=counters')}
              className="mt-4"
            >
              <ArrowLeft className="mr-2 size-4" />
              Listeye Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isNew && loadingItem) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              <span>Yükleniyor...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSave} className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle>
                  {isNew ? page?.counter_create_title : page?.counter_edit_title}
                </CardTitle>
                <CardDescription>
                  {isNew
                    ? 'Yeni skill counter oluşturun'
                    : 'Mevcut skill counter düzenleyin'}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/skills?tab=counters')}
                disabled={busy}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                Geri
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Genel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Row 1: Locale, Display Order, Active */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Locale - ✅ FIXED: Always has a value */}
              <div>
                <AdminLocaleSelect
                  value={formData.locale || defaultLocaleFromDb || ''}
                  onChange={(v) => setFormData((prev) => ({ ...prev, locale: v }))}
                  options={safeLocaleOptions}
                  loading={localesLoading}
                  disabled={busy}
                />
              </div>

              {/* Display Order */}
              <div className="space-y-2">
                <Label htmlFor="display_order" className="text-sm">
                  Sıralama
                </Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      display_order: Number(e.target.value) || 0,
                    }))
                  }
                  disabled={busy}
                  min={0}
                />
              </div>

              {/* Active - ✅ FIXED: Boolean type */}
              <div className="space-y-2">
                <Label htmlFor="is_active" className="text-sm">
                  Durum
                </Label>
                <div className="flex items-center gap-3 rounded-md border px-3 py-2">
                  <Switch
                    id="is_active"
                    checked={Boolean(formData.is_active)}
                    onCheckedChange={(checked: boolean) =>
                      setFormData((prev) => ({ ...prev, is_active: checked }))
                    }
                    disabled={busy}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer text-sm">
                    {formData.is_active ? (
                      <Badge variant="default">Aktif</Badge>
                    ) : (
                      <Badge variant="secondary">Pasif</Badge>
                    )}
                  </Label>
                </div>
              </div>
            </div>

            {/* Row 2: Title, Slug */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm">
                  Başlık <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Örn: React Development"
                  disabled={busy}
                  required
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm">
                  Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="Örn: react-development"
                  disabled={busy}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  URL dostu format (küçük harf, tire ile ayrılmış)
                </p>
              </div>
            </div>

            {/* Row 3: Percent */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="percent" className="text-sm">
                  Yüzde (%)
                </Label>
                <Input
                  id="percent"
                  type="number"
                  value={formData.percent}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      percent: Number(e.target.value) || 0,
                    }))
                  }
                  placeholder="0-100"
                  disabled={busy}
                  min={0}
                  max={100}
                />
              </div>
            </div>

            {/* Row 4: Image URL, Asset ID */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="image_url" className="text-sm">
                  Resim URL
                </Label>
                <Input
                  id="image_url"
                  value={formData.image_url ?? ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, image_url: e.target.value }))
                  }
                  placeholder="https://example.com/image.png"
                  disabled={busy}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_asset_id" className="text-sm">
                  Asset ID
                </Label>
                <Input
                  id="image_asset_id"
                  value={formData.image_asset_id ?? ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, image_asset_id: e.target.value }))
                  }
                  placeholder="asset-id-123"
                  disabled={busy}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:justify-between">
            <div>
              {!isNew && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteClick}
                  disabled={busy}
                  className="gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Siliniyor...
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-4" />
                      Sil
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/skills?tab=counters')}
                disabled={busy}
              >
                İptal
              </Button>
              <Button type="submit" disabled={busy} className="gap-2">
                {isCreating || isUpdating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Kaydet
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silmek istediğinizden emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{formData.title || 'Bu kayıt'}</strong> silinecek. Bu işlem geri
              alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}