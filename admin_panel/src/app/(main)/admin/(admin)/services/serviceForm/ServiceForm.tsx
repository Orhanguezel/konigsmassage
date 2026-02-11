'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/services/_components/serviceForm/ServiceForm.tsx
// guezelwebdesign – Admin Service Create/Edit Form (FINAL)
// - shadcn/tailwind theme
// - Locale source: useAdminLocales()
// - Canonical cover: image_url (+ legacy featured_image mirror)
// - Null-safe submit: empty => null
// - tags + meta_* fields
// - Gallery: ServiceFormImageColumn (DB-backed)
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';

import type { ServiceDto, ServiceFormProps, ServiceFormValues } from '@/integrations/shared';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { AdminJsonEditor } from '@/app/(main)/admin/_components/common/AdminJsonEditor';
import RichContentEditor from '@/app/(main)/admin/_components/common/RichContentEditor';

import { buildInitialValues, normalizeLocale, slugify } from './serviceForm.utils';
import { ServiceFormImageColumn } from './ServiceFormImageColumn';
import { useServiceEditorImageUpload } from './useServiceEditorImageUpload';

const norm = (v: unknown) => String(v ?? '').trim();
const toNull = (v: unknown) => {
  const s = norm(v);
  return s ? s : null;
};
const toInt = (v: unknown, fallback = 0) => {
  const n = Number(String(v ?? '').trim());
  return Number.isFinite(n) ? n : fallback;
};

type LocaleOption = { value: string; label: string };

export const ServiceForm: React.FC<ServiceFormProps> = ({
  mode,
  initialData,
  loading,
  saving,
  // legacy props kept for compatibility; ignored for locale source
  locales: _localesIgnored,
  localesLoading: _localesLoadingIgnored,
  defaultLocale,
  onSubmit,
  onCancel,
  onLocaleChange,
}) => {
  const adminLocales = useAdminLocales() as any;
  const t = useAdminT();

  const localesLoading: boolean =
    !!adminLocales?.loading || !!adminLocales?.isLoading || !!adminLocales?.isFetching;

  const defaultLocaleFromHook = normalizeLocale(
    adminLocales?.defaultLocale ?? adminLocales?.default_locale ?? adminLocales?.default ?? '',
  );

  const localeOptions: LocaleOption[] = React.useMemo(() => {
    const raw = Array.isArray(adminLocales?.locales)
      ? adminLocales.locales
      : Array.isArray(adminLocales?.options)
        ? adminLocales.options
        : Array.isArray(adminLocales?.localeOptions)
          ? adminLocales.localeOptions
          : [];

    return raw
      .map((x: any) => ({
        value: normalizeLocale(x?.value ?? x?.code ?? x),
        label: String(x?.label ?? x?.name ?? x?.value ?? x?.code ?? x ?? '').trim(),
      }))
      .filter((x: LocaleOption) => !!x.value)
      .map((x: LocaleOption) => ({ value: x.value, label: x.label || x.value.toUpperCase() }));
  }, [adminLocales]);

  const fallbackLocale = React.useMemo(() => {
    const def = normalizeLocale(
      defaultLocale || defaultLocaleFromHook || localeOptions?.[0]?.value || '',
    );
    return def || '';
  }, [defaultLocale, defaultLocaleFromHook, localeOptions]);

  const [values, setValues] = React.useState<ServiceFormValues>(() =>
    buildInitialValues(initialData as ServiceDto | undefined, defaultLocale, fallbackLocale),
  );

  const [slugTouched, setSlugTouched] = React.useState(false);

  React.useEffect(() => {
    const next = buildInitialValues(
      initialData as ServiceDto | undefined,
      defaultLocale,
      fallbackLocale,
    );

    // cover single source
    const coverFromDb =
      norm((initialData as any)?.image_url) || norm((initialData as any)?.featured_image) || '';
    const coverFromNext =
      norm((next as any)?.image_url) || norm((next as any)?.featured_image) || '';
    const cover = coverFromNext || coverFromDb || '';

    setValues({
      ...next,
      image_url: cover,
      featured_image: cover,

      tags: norm((next as any)?.tags) || norm((initialData as any)?.tags),
      meta_title: norm((next as any)?.meta_title) || norm((initialData as any)?.meta_title),
      meta_description:
        norm((next as any)?.meta_description) || norm((initialData as any)?.meta_description),
      meta_keywords:
        norm((next as any)?.meta_keywords) || norm((initialData as any)?.meta_keywords),
    });

    setSlugTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, defaultLocale, fallbackLocale]);

  const disabled = loading || saving;

  const effectiveLocale = normalizeLocale(values.locale || fallbackLocale);

  // ensure locale valid once locales loaded
  React.useEffect(() => {
    if (localesLoading) return;
    const list = localeOptions.map((x) => x.value);
    const cur = normalizeLocale(values.locale);
    const next =
      (cur && list.includes(cur) ? cur : normalizeLocale(fallbackLocale)) || list[0] || '';

    if (next && next !== cur) {
      setValues((prev) => ({ ...prev, locale: next }));
      onLocaleChange?.(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localesLoading, localeOptions, fallbackLocale]);

  const imageMetadata = React.useMemo(
    () => ({
      module_key: 'service',
      locale: effectiveLocale,
      service_slug: values.slug || values.name || '',
      ...(values.id ? { service_id: values.id } : {}),
    }),
    [effectiveLocale, values.slug, values.name, values.id],
  );

  const { onUpload } = useServiceEditorImageUpload({ metadata: imageMetadata });

  const coverValue = norm(values.image_url) || norm(values.featured_image);

  const handleLocaleChange = (nextLocaleRaw: string) => {
    const next = normalizeLocale(nextLocaleRaw);
    const list = localeOptions.map((x) => x.value);
    const resolved = next && list.includes(next) ? next : normalizeLocale(fallbackLocale);

    if (!resolved) {
      toast.error(t('admin.services.form.localeRequired'));
      return;
    }

    setValues((prev) => ({ ...prev, locale: resolved }));
    onLocaleChange?.(resolved);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;

    const loc = normalizeLocale(values.locale || fallbackLocale);
    if (!loc) {
      toast.error(t('admin.services.form.localeRequired'));
      return;
    }

    if (!values.name.trim() || !values.slug.trim()) {
      toast.error(t('admin.services.form.nameSlugRequired'));
      return;
    }

    const cover = norm(values.image_url) || norm(values.featured_image);

    const payload = {
      ...values,

      locale: loc,
      name: values.name.trim(),
      slug: values.slug.trim(),
      description: String(values.description || ''),

      featured: !!values.featured,
      is_active: !!values.is_active,
      display_order: toInt(values.display_order, 0),

      image_url: toNull(cover),
      featured_image: toNull(cover),
      image_asset_id: toNull(values.image_asset_id),

      image_alt: toNull(values.image_alt),
      material: toNull(values.material),
      price: toNull(values.price),
      includes: toNull(values.includes),
      warranty: toNull(values.warranty),

      tags: toNull(values.tags),
      meta_title: toNull(values.meta_title),
      meta_description: toNull(values.meta_description),
      meta_keywords: toNull(values.meta_keywords),

      area: toNull(values.area),
      duration: toNull(values.duration),
      maintenance: toNull(values.maintenance),
      season: toNull(values.season),
      equipment: toNull(values.equipment),
    };

    void onSubmit(payload as any);
  };

  const localeDisabled = disabled || localesLoading || localeOptions.length === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">
                {mode === 'create' ? t('admin.services.form.createTitle') : t('admin.services.form.editTitle')}
              </CardTitle>
              <CardDescription>
                {t('admin.services.form.description')}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              {loading ? <Badge variant="secondary">{t('admin.services.form.loading')}</Badge> : null}

              {onCancel ? (
                <Button type="button" variant="outline" onClick={onCancel} disabled={disabled}>
                  {t('admin.services.form.backButton')}
                </Button>
              ) : null}

              <Button type="submit" disabled={disabled}>
                {saving ? (mode === 'create' ? t('admin.services.form.creating') : t('admin.services.form.saving')) : (mode === 'create' ? t('admin.services.form.createButton') : t('admin.services.form.saveButton'))}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Tabs defaultValue="form">
            <TabsList>
              <TabsTrigger value="form">{t('admin.services.form.formTab')}</TabsTrigger>
              <TabsTrigger value="json">{t('admin.services.form.jsonTab')}</TabsTrigger>
            </TabsList>

            <TabsContent value="json" className="mt-4">
              <AdminJsonEditor
                value={values}
                disabled={disabled}
                onChange={(next) => setValues(next as ServiceFormValues)}
                label={t('admin.services.form.jsonLabel')}
                helperText={t('admin.services.form.jsonHelperText')}
              />
            </TabsContent>

            <TabsContent value="form" className="mt-4">
              <div className="grid gap-6 lg:grid-cols-12">
                {/* LEFT */}
                <div className="space-y-4 lg:col-span-8">
                  {/* Locale + flags */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>{t('admin.services.form.localeLabel')}</Label>
                      <Select
                        value={normalizeLocale(values.locale) || ''}
                        onValueChange={handleLocaleChange}
                        disabled={localeDisabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin.services.form.localePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {localeOptions.map((opt) => (
                            <SelectItem key={`${opt.value}:${opt.label}`} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {!localesLoading && localeOptions.length === 0 ? (
                        <p className="text-xs text-destructive">
                          {t('admin.services.form.localeEmptyError')}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-end gap-4 md:col-span-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="svc_is_active"
                          checked={!!values.is_active}
                          onCheckedChange={(v) =>
                            setValues((prev) => ({ ...prev, is_active: v === true }))
                          }
                          disabled={disabled}
                        />
                        <Label htmlFor="svc_is_active">{t('admin.services.form.activeLabel')}</Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="svc_featured"
                          checked={!!values.featured}
                          onCheckedChange={(v) =>
                            setValues((prev) => ({ ...prev, featured: v === true }))
                          }
                          disabled={disabled}
                        />
                        <Label htmlFor="svc_featured">{t('admin.services.form.featuredLabel')}</Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* name + slug */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t('admin.services.form.nameLabel')}</Label>
                      <Input
                        value={values.name}
                        onChange={(e) => {
                          const nameValue = e.target.value;
                          setValues((prev) => {
                            const next: ServiceFormValues = { ...prev, name: nameValue };
                            if (!slugTouched) next.slug = slugify(nameValue);
                            return next;
                          });
                        }}
                        disabled={disabled}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t('admin.services.form.slugLabel')}</Label>
                      <Input
                        value={values.slug}
                        onFocus={() => setSlugTouched(true)}
                        onChange={(e) => {
                          setSlugTouched(true);
                          setValues((prev) => ({ ...prev, slug: e.target.value }));
                        }}
                        disabled={disabled}
                      />
                    </div>
                  </div>

                  {/* rich content */}
                  <div className="space-y-2">
                    <Label>{t('admin.services.form.descriptionLabel')}</Label>
                    <RichContentEditor
                      label=""
                      value={values.description || ''}
                      onChange={(next) => setValues((prev) => ({ ...prev, description: next }))}
                      disabled={disabled}
                      height="280px"
                      onUploadImage={onUpload}
                    />
                  </div>

                  {/* i18n fields */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t('admin.services.form.materialLabel')}</Label>
                      <Input
                        value={values.material}
                        onChange={(e) => setValues((p) => ({ ...p, material: e.target.value }))}
                        disabled={disabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('admin.services.form.priceLabel')}</Label>
                      <Input
                        value={values.price}
                        onChange={(e) => setValues((p) => ({ ...p, price: e.target.value }))}
                        disabled={disabled}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('admin.services.form.includesLabel')}</Label>
                    <Textarea
                      rows={2}
                      value={values.includes}
                      onChange={(e) => setValues((p) => ({ ...p, includes: e.target.value }))}
                      disabled={disabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('admin.services.form.warrantyLabel')}</Label>
                    <Textarea
                      rows={2}
                      value={values.warranty}
                      onChange={(e) => setValues((p) => ({ ...p, warranty: e.target.value }))}
                      disabled={disabled}
                    />
                  </div>

                  {/* tags + meta */}
                  <div className="space-y-2">
                    <Label>
                      {t('admin.services.form.tagsLabel')} <span className="text-muted-foreground">{t('admin.services.form.tagsHelp')}</span>
                    </Label>
                    <Input
                      value={values.tags}
                      onChange={(e) => setValues((p) => ({ ...p, tags: e.target.value }))}
                      disabled={disabled}
                      placeholder={t('admin.services.form.tagsPlaceholder')}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t('admin.services.form.metaTitleLabel')}</Label>
                      <Input
                        value={values.meta_title}
                        onChange={(e) => setValues((p) => ({ ...p, meta_title: e.target.value }))}
                        disabled={disabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('admin.services.form.metaKeywordsLabel')}</Label>
                      <Input
                        value={values.meta_keywords}
                        onChange={(e) =>
                          setValues((p) => ({ ...p, meta_keywords: e.target.value }))
                        }
                        disabled={disabled}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('admin.services.form.metaDescriptionLabel')}</Label>
                    <Textarea
                      rows={2}
                      value={values.meta_description}
                      onChange={(e) =>
                        setValues((p) => ({ ...p, meta_description: e.target.value }))
                      }
                      disabled={disabled}
                    />
                  </div>

                  {/* technical */}
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t('admin.services.form.areaLabel')}</Label>
                      <Input
                        value={values.area}
                        onChange={(e) => setValues((p) => ({ ...p, area: e.target.value }))}
                        disabled={disabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('admin.services.form.durationLabel')}</Label>
                      <Input
                        value={values.duration}
                        onChange={(e) => setValues((p) => ({ ...p, duration: e.target.value }))}
                        disabled={disabled}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t('admin.services.form.maintenanceLabel')}</Label>
                      <Input
                        value={values.maintenance}
                        onChange={(e) => setValues((p) => ({ ...p, maintenance: e.target.value }))}
                        disabled={disabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('admin.services.form.seasonLabel')}</Label>
                      <Input
                        value={values.season}
                        onChange={(e) => setValues((p) => ({ ...p, season: e.target.value }))}
                        disabled={disabled}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('admin.services.form.equipmentLabel')}</Label>
                    <Input
                      value={values.equipment}
                      onChange={(e) => setValues((p) => ({ ...p, equipment: e.target.value }))}
                      disabled={disabled}
                    />
                  </div>
                </div>

                {/* RIGHT */}
                <div className="space-y-4 lg:col-span-4">
                  <div className="space-y-2">
                    <Label>{t('admin.services.form.displayOrderLabel')}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={values.display_order}
                      onChange={(e) => setValues((p) => ({ ...p, display_order: e.target.value }))}
                      disabled={disabled}
                    />
                  </div>

                  <ServiceFormImageColumn
                    serviceId={values.id}
                    locale={effectiveLocale}
                    disabled={disabled || false}
                    metadata={imageMetadata}
                    featuredImageValue={coverValue}
                    onFeaturedImageChange={(url) => {
                      const u = norm(url);
                      setValues((prev) => ({ ...prev, image_url: u, featured_image: u }));
                    }}
                  />

                  <div className="space-y-2">
                    <Label>{t('admin.services.form.imageAltLabel')}</Label>
                    <Input
                      value={values.image_alt}
                      onChange={(e) => setValues((p) => ({ ...p, image_alt: e.target.value }))}
                      disabled={disabled}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="text-sm font-medium">{t('admin.services.form.multiLocaleTitle')}</div>

                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="svc_replicate_all"
                        checked={!!values.replicate_all_locales}
                        onCheckedChange={(v) =>
                          setValues((p) => ({ ...p, replicate_all_locales: v === true }))
                        }
                        disabled={disabled}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="svc_replicate_all" className="leading-none">
                          {t('admin.services.form.replicateAllLocales')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          <code>replicate_all_locales</code>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="svc_apply_all"
                        checked={!!values.apply_all_locales}
                        onCheckedChange={(v) =>
                          setValues((p) => ({ ...p, apply_all_locales: v === true }))
                        }
                        disabled={disabled}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="svc_apply_all" className="leading-none">
                          {t('admin.services.form.applyAllLocales')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          <code>apply_all_locales</code>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </form>
  );
};
