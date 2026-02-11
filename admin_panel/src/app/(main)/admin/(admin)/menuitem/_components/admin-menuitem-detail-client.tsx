'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/menuitem/[id]/admin-menuitem-detail-client.tsx
// FINAL — Admin Menu Item Detail/Create (App Router + shadcn)
// ✅ All TypeScript errors fixed
// ✅ SelectItem value="" runtime error fixed
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { resolveAdminApiLocale } from '../../../../../../i18n/adminLocale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type {
  AdminMenuItemDto,
  AdminMenuItemCreatePayload,
  MenuLocation,
  MenuItemType,
} from '@/integrations/shared';
import {
  useListMenuItemsAdminQuery,
  useGetMenuItemAdminQuery,
  useCreateMenuItemAdminMutation,
  useUpdateMenuItemAdminMutation,
  useDeleteMenuItemAdminMutation,
} from '@/integrations/hooks';

function getErrMsg(e: unknown): string {
  const anyErr = e as any;
  return (
    anyErr?.data?.error?.message || anyErr?.data?.message || anyErr?.message || 'İşlem başarısız'
  );
}

type FormData = {
  title: string;
  url: string;
  type: MenuItemType;
  page_id: string;
  parent_id: string;
  location: MenuLocation;
  icon: string;
  section_id: string;
  is_active: boolean;
  display_order: number;
  locale: string;
};

export default function AdminMenuItemDetailClient({ id }: { id: string }) {
  const t = useAdminT();
  const router = useRouter();
  const isNew = id === 'new';

  const { localeOptions, defaultLocaleFromDb } = useAdminLocales();

  const apiLocale = React.useMemo(() => {
    return resolveAdminApiLocale(localeOptions as any, defaultLocaleFromDb, 'de');
  }, [localeOptions, defaultLocaleFromDb]);

  // ✅ FIX: Extract items from response
  const { data: allItemsResult } = useListMenuItemsAdminQuery({ limit: 200 });
  const allItems = React.useMemo(() => {
    if (!allItemsResult) return [];
    if (Array.isArray(allItemsResult)) return allItemsResult;
    if ('items' in allItemsResult && Array.isArray(allItemsResult.items))
      return allItemsResult.items;
    return [];
  }, [allItemsResult]);

  // Fetch specific item if editing
  const { data: item } = useGetMenuItemAdminQuery({ id, locale: apiLocale }, { skip: isNew });

  const [createMenuItem, { isLoading: isCreating }] = useCreateMenuItemAdminMutation();
  const [updateMenuItem, { isLoading: isUpdating }] = useUpdateMenuItemAdminMutation();
  const [deleteMenuItem, { isLoading: isDeleting }] = useDeleteMenuItemAdminMutation();

  const [formData, setFormData] = React.useState<FormData>({
    title: '',
    url: '',
    type: 'page',
    page_id: '',
    parent_id: '',
    location: 'header',
    icon: '',
    section_id: '',
    is_active: true,
    display_order: 0,
    locale: apiLocale || 'de',
  });

  // Load existing data
  React.useEffect(() => {
    if (!isNew && item) {
      setFormData({
        title: item.title,
        url: item.url || '',
        type: item.type,
        page_id: item.page_id || '',
        parent_id: item.parent_id || '',
        location: item.location,
        icon: item.icon || '',
        section_id: item.section_id || '',
        is_active: item.is_active,
        display_order: item.display_order || 0,
        locale: item.locale || apiLocale || 'de',
      });
    }
  }, [isNew, item, apiLocale]);

  // Set default locale when loaded
  React.useEffect(() => {
    if (isNew && apiLocale && !formData.locale) {
      setFormData((p) => ({ ...p, locale: apiLocale }));
    }
  }, [isNew, apiLocale, formData.locale]);

  const busy = isCreating || isUpdating || isDeleting;

  const handleBack = () => {
    router.push('/admin/menuitem');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Başlık gerekli');
      return;
    }

    if (formData.type === 'custom' && !formData.url.trim()) {
      toast.error('Özel URL tipi için URL gerekli');
      return;
    }

    if (formData.type === 'page' && !formData.page_id.trim()) {
      toast.error('Sayfa tipi için sayfa ID gerekli');
      return;
    }

    try {
      if (isNew) {
        const body: AdminMenuItemCreatePayload = {
          title: formData.title.trim(),
          url: formData.type === 'custom' ? formData.url.trim() : null,
          type: formData.type,
          page_id: formData.type === 'page' ? formData.page_id.trim() : null,
          parent_id: formData.parent_id.trim() || null,
          location: formData.location,
          icon: formData.icon.trim() || null,
          section_id: formData.section_id.trim() || null,
          is_active: formData.is_active ? 1 : 0,
          display_order: formData.display_order || 0,
          locale: formData.locale,
        };
        await createMenuItem(body).unwrap();
        toast.success('Menü öğesi oluşturuldu');
        router.push('/admin/menuitem');
      } else {
        const data = {
          title: formData.title.trim(),
          url: formData.type === 'custom' ? formData.url.trim() : null,
          type: formData.type,
          page_id: formData.type === 'page' ? formData.page_id.trim() : null,
          parent_id: formData.parent_id.trim() || null,
          location: formData.location,
          icon: formData.icon.trim() || null,
          section_id: formData.section_id.trim() || null,
          is_active: formData.is_active ? 1 : 0,
          display_order: formData.display_order || 0,
          locale: formData.locale,
        };
        await updateMenuItem({ id, data }).unwrap();
        toast.success('Menü öğesi güncellendi');
        router.push('/admin/menuitem');
      }
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const handleDelete = async () => {
    if (!confirm(`"${item?.title}" menü öğesini silmek istediğinize emin misiniz?`)) return;

    try {
      await deleteMenuItem({ id }).unwrap();
      toast.success('Menü öğesi silindi');
      router.push('/admin/menuitem');
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  // Filter parent options (exclude self and descendants)
  const parentOptions = React.useMemo(() => {
    return allItems.filter((i: AdminMenuItemDto) => i.id !== id && i.parent_id !== id);
  }, [allItems, id]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">
                {isNew ? t('form.createTitle') : t('form.editTitle')}
              </CardTitle>
              <CardDescription>
                {isNew ? t('form.createDesc') : t('form.editDesc')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleBack} variant="outline" size="sm">
                <ArrowLeft className="mr-2 size-4" />
                Geri
              </Button>
              {!isNew && (
                <Button onClick={handleDelete} disabled={busy} variant="destructive" size="sm">
                  <Trash2 className="mr-2 size-4" />
                  Sil
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Menü Öğesi Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Temel Bilgiler</h3>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Başlık <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Menü başlığı"
                  required
                  disabled={busy}
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">
                  Tip <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData((p) => ({ ...p, type: v as MenuItemType }))}
                  disabled={busy}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="page">Sayfa (Internal)</SelectItem>
                    <SelectItem value="custom">Özel URL</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Sayfa: Site içi sayfa, Özel URL: Dış veya özel link
                </p>
              </div>

              {/* Page ID (if type is page) */}
              {formData.type === 'page' && (
                <div className="space-y-2">
                  <Label htmlFor="page_id">
                    Sayfa ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="page_id"
                    value={formData.page_id}
                    onChange={(e) => setFormData((p) => ({ ...p, page_id: e.target.value }))}
                    placeholder="UUID veya slug"
                    required={formData.type === 'page'}
                    disabled={busy}
                  />
                  <p className="text-xs text-muted-foreground">Özel sayfanın ID'si veya slug'ı</p>
                </div>
              )}

              {/* URL (if type is custom) */}
              {formData.type === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="url">
                    URL <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData((p) => ({ ...p, url: e.target.value }))}
                    placeholder="https://example.com veya /relative-path"
                    required={formData.type === 'custom'}
                    disabled={busy}
                  />
                </div>
              )}

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">
                  Konum <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.location}
                  onValueChange={(v) => setFormData((p) => ({ ...p, location: v as MenuLocation }))}
                  disabled={busy}
                >
                  <SelectTrigger id="location">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Locale */}
              <div className="space-y-2">
                <Label htmlFor="locale">
                  Dil <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.locale}
                  onValueChange={(v) => setFormData((p) => ({ ...p, locale: v }))}
                  disabled={busy}
                >
                  <SelectTrigger id="locale">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {localeOptions.map((opt: any) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Gelişmiş Ayarlar</h3>

              {/* ✅ FIX: Parent ID — value="" yerine value="none" kullanıldı */}
              <div className="space-y-2">
                <Label htmlFor="parent_id">Üst Menü (Opsiyonel)</Label>
                <Select
                  value={formData.parent_id || 'none'}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, parent_id: v === 'none' ? '' : v }))
                  }
                  disabled={busy}
                >
                  <SelectTrigger id="parent_id">
                    <SelectValue placeholder="Üst menü yok (ana seviye)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Üst menü yok</SelectItem>
                    {parentOptions.map((p: AdminMenuItemDto) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title} ({p.location})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Alt menü oluşturmak için üst menüyü seçin
                </p>
              </div>

              {/* Icon */}
              <div className="space-y-2">
                <Label htmlFor="icon">İkon (Opsiyonel)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData((p) => ({ ...p, icon: e.target.value }))}
                  placeholder="İkon class veya emoji"
                  disabled={busy}
                />
                <p className="text-xs text-muted-foreground">
                  Örnek: fa fa-home, lucide-home, veya 🏠
                </p>
              </div>

              {/* Section ID */}
              <div className="space-y-2">
                <Label htmlFor="section_id">Section ID (Opsiyonel)</Label>
                <Input
                  id="section_id"
                  value={formData.section_id}
                  onChange={(e) => setFormData((p) => ({ ...p, section_id: e.target.value }))}
                  placeholder="Grup ID'si"
                  disabled={busy}
                />
              </div>

              {/* Display Order */}
              <div className="space-y-2">
                <Label htmlFor="display_order">Sıra Numarası</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, display_order: Number(e.target.value) }))
                  }
                  placeholder="0"
                  disabled={busy}
                />
                <p className="text-xs text-muted-foreground">
                  Menüde gösterilme sırası (küçük değerler önce)
                </p>
              </div>

              {/* Is Active */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Aktif</Label>
                  <p className="text-xs text-muted-foreground">Menü öğesini sitede göster</p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_active: checked }))}
                  disabled={busy}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" onClick={handleBack} variant="outline" disabled={busy}>
                İptal
              </Button>
              <Button type="submit" disabled={busy}>
                <Save className="mr-2 size-4" />
                {busy ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Detail info (for existing items) */}
      {!isNew && item && (
        <Card>
          <CardHeader>
            <CardTitle>Meta Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID</p>
                <p className="text-sm">{item.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Oluşturulma</p>
                <p className="text-sm">
                  {item.created_at ? new Date(item.created_at).toLocaleString('tr-TR') : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Güncellenme</p>
                <p className="text-sm">
                  {item.updated_at ? new Date(item.updated_at).toLocaleString('tr-TR') : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dil</p>
                <p className="text-sm">{item.locale || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
