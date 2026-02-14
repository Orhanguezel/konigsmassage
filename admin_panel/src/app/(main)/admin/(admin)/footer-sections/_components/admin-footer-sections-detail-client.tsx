'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/footer-sections/[id]/admin-footer-sections-detail-client.tsx
// FINAL — Admin Footer Section Create/Edit Form (App Router + shadcn)
// ✅ All TypeScript errors fixed
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { resolveAdminApiLocale } from '@/i18n/adminLocale';
import { localeShortClientOr } from '@/i18n/localeShortClient';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AdminLocaleSelect,
  type AdminLocaleOption,
} from '@/app/(main)/admin/_components/common/AdminLocaleSelect';

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

import type { FooterSectionCreatePayload } from '@/integrations/shared';
import {
  useGetFooterSectionAdminQuery,
  useCreateFooterSectionAdminMutation,
  useUpdateFooterSectionAdminMutation,
  useDeleteFooterSectionAdminMutation,
} from '@/integrations/hooks';

type FormData = {
  title: string;
  slug: string;
  description: string;
  is_active: boolean;
  display_order: number;
  locale: string;
};

function getErrMsg(e: unknown, defaultMsg: string = 'Operation failed'): string {
  const anyErr = e as any;
  return anyErr?.data?.error?.message || anyErr?.data?.message || anyErr?.message || defaultMsg;
}

export default function AdminFooterSectionsDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const isNew = id === 'new';
  const t = useAdminT();

  // Locale management
  const {
    localeOptions,
    defaultLocaleFromDb,
    coerceLocale,
    loading: localesLoading,
  } = useAdminLocales();

  const safeLocaleOptions: AdminLocaleOption[] = React.useMemo(() => {
    if (!Array.isArray(localeOptions)) return [];
    return localeOptions.map((opt) => ({
      value: opt.value || '',
      label: opt.label || opt.value || '',
    }));
  }, [localeOptions]);

  const initialLocale = React.useMemo(() => {
    return (
      defaultLocaleFromDb ||
      localeShortClientOr(typeof window !== 'undefined' ? navigator.language : 'de') ||
      'de'
    );
  }, [defaultLocaleFromDb]);

  // RTK Query - only fetch if editing
  const {
    data: existingItem,
    isLoading: loadingItem,
    error: loadError,
  } = useGetFooterSectionAdminQuery({ id, locale: undefined }, { skip: isNew });

  const [createSection, { isLoading: isCreating }] = useCreateFooterSectionAdminMutation();
  const [updateSection, { isLoading: isUpdating }] = useUpdateFooterSectionAdminMutation();
  const [deleteSection, { isLoading: isDeleting }] = useDeleteFooterSectionAdminMutation();

  // Form state
  const [formData, setFormData] = React.useState<FormData>({
    title: '',
    slug: '',
    description: '',
    is_active: true,
    display_order: 0,
    locale: initialLocale,
  });

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // Load existing data
  React.useEffect(() => {
    if (!isNew && existingItem) {
      setFormData({
        title: existingItem.title || '',
        slug: existingItem.slug || '',
        description: existingItem.description || '',
        is_active: existingItem.is_active,
        display_order: existingItem.display_order || 0,
        locale: existingItem.locale || initialLocale,
      });
    }
  }, [existingItem, isNew, initialLocale]);

  // Update default locale if needed
  React.useEffect(() => {
    if (isNew && defaultLocaleFromDb && !formData.locale) {
      setFormData((prev) => ({ ...prev, locale: defaultLocaleFromDb }));
    }
  }, [isNew, defaultLocaleFromDb, formData.locale]);

  const busy = isCreating || isUpdating || isDeleting || loadingItem;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error(t('footerSections.form.error.titleRequired'));
      return;
    }

    if (!formData.slug.trim()) {
      toast.error(t('footerSections.form.error.slugRequired'));
      return;
    }

    const apiLocale =
      formData.locale || resolveAdminApiLocale(localeOptions, defaultLocaleFromDb, 'de');

    try {
      if (isNew) {
        const payload: FooterSectionCreatePayload = {
          title: formData.title.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim() || null,
          is_active: formData.is_active,
          display_order: formData.display_order,
          locale: apiLocale,
        };

        await createSection(payload).unwrap();
        toast.success(t('footerSections.form.created'));
        router.push('/admin/footer-sections');
      } else {
        await updateSection({
          id,
          data: {
            title: formData.title.trim(),
            slug: formData.slug.trim(),
            description: formData.description.trim() || null,
            is_active: formData.is_active,
            display_order: formData.display_order,
            locale: apiLocale,
          },
        }).unwrap();
        toast.success(t('footerSections.form.updated'));
      }
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (isNew) return;

    try {
      await deleteSection(id).unwrap();
      toast.success(t('footerSections.list.deleted'));
      router.push('/admin/footer-sections');
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const handleLocaleChange = (locale: string) => {
    const coerced = coerceLocale(locale, defaultLocaleFromDb);
    setFormData((prev) => ({ ...prev, locale: coerced }));
  };

  if (loadError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-destructive">
              {t('footerSections.form.error.load')}: {getErrMsg(loadError)}
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/footer-sections')}
              className="mt-4"
            >
              <ArrowLeft className="size-4" />
              {t('footerSections.form.error.return', undefined, 'Return to List')}
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
              <span>{t('footerSections.header.loading')}</span>
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
                  {isNew
                    ? t('footerSections.form.createTitle')
                    : t('footerSections.form.editTitle')}
                </CardTitle>
                <CardDescription>
                  {isNew ? t('footerSections.form.createDesc') : t('footerSections.form.editDesc')}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/footer-sections')}
                disabled={busy}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                {t('footerSections.form.back')}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('footerSections.form.generalInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Row 1: Locale, Display Order, Active */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Locale */}
              <div>
                <AdminLocaleSelect
                  value={formData.locale}
                  onChange={handleLocaleChange}
                  options={safeLocaleOptions}
                  loading={localesLoading}
                  disabled={busy}
                />
              </div>

              {/* Display Order */}
              <div className="space-y-2">
                <Label htmlFor="display_order" className="text-sm">
                  {t('footerSections.form.displayOrder')}
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
                  placeholder={t('footerSections.form.displayOrderPlaceholder')}
                />
              </div>

              {/* Active */}
              <div className="space-y-2">
                <Label htmlFor="is_active" className="text-sm">
                  {t('footerSections.form.active')}
                </Label>
                <div className="flex items-center gap-3 rounded-md border px-3 py-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_active: checked }))
                    }
                    disabled={busy}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer text-sm">
                    {formData.is_active ? (
                      <Badge variant="default">
                        {t('footerSections.header.activeOptions.active')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {t('footerSections.header.activeOptions.inactive')}
                      </Badge>
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
                  {t('footerSections.form.title')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={t('footerSections.form.titlePlaceholder')}
                  disabled={busy}
                  required
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm">
                  {t('footerSections.form.slug')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder={t('footerSections.form.slugPlaceholder')}
                  disabled={busy}
                  required
                />
                <p className="text-xs text-muted-foreground">URL slug</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">
                {t('footerSections.form.description')}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={t('footerSections.form.descriptionPlaceholder')}
                disabled={busy}
                rows={4}
              />
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
                      {t('footerSections.form.saving')}
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-4" />
                      {t('footerSections.header.delete')}
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/footer-sections')}
                disabled={busy}
              >
                {t('footerSections.list.cancel')}
              </Button>
              <Button type="submit" disabled={busy} className="gap-2">
                {isCreating || isUpdating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t('footerSections.form.saving')}
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    {t('footerSections.form.save')}
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
            <AlertDialogTitle>{t('footerSections.list.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('footerSections.list.deleteConfirmDesc')}
              <br />
              <strong>{formData.title || '-'}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('footerSections.list.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {t('footerSections.list.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
