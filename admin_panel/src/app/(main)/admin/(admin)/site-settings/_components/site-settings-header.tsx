'use client';

// =============================================================
// FILE: src/components/admin/site-settings/SiteSettingsHeader.tsx
// FINAL — Site Settings Header (shadcn/ui)
// - NO bootstrap classes
// - Tabs + Filters (UsersListClient style)
// - Locale select disabled on global tabs
// =============================================================

import * as React from 'react';
import { Search, RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type SettingsTab =
  | 'list'
  | 'global_list'
  | 'general'
  | 'seo'
  | 'smtp'
  | 'cloudinary'
  | 'brand_media'
  | 'api';

export type LocaleOption = {
  value: string;
  label: string;
};

export type SiteSettingsHeaderProps = {
  search: string;
  onSearchChange: (v: string) => void;

  locale: string; // "" only while loading
  onLocaleChange: (v: string) => void;

  loading: boolean;
  onRefresh: () => void;

  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;

  locales: LocaleOption[];
  localesLoading?: boolean;
};

type SettingsScope = 'localized' | 'global' | 'mixed';

const TAB_ITEMS: { id: SettingsTab; label: string; scope: SettingsScope }[] = [
  { id: 'list', label: 'Liste (Dil)', scope: 'mixed' },
  { id: 'global_list', label: 'Liste (Global *)', scope: 'global' },
  { id: 'general', label: 'Genel / UI', scope: 'localized' },
  { id: 'seo', label: 'SEO', scope: 'localized' },
  { id: 'smtp', label: 'SMTP / E-posta', scope: 'global' },
  { id: 'cloudinary', label: 'Cloudinary / Storage', scope: 'global' },
  { id: 'brand_media', label: 'Marka Medyası', scope: 'global' },
  { id: 'api', label: 'API & Entegrasyon', scope: 'global' },
];

function isGlobalTab(t: SettingsTab) {
  return (
    t === 'global_list' || t === 'smtp' || t === 'cloudinary' || t === 'brand_media' || t === 'api'
  );
}

export const SiteSettingsHeader: React.FC<SiteSettingsHeaderProps> = ({
  search,
  onSearchChange,
  locale,
  onLocaleChange,
  loading,
  onRefresh,
  activeTab,
  onTabChange,
  locales,
  localesLoading,
}) => {
  const localeDisabled = loading || !!localesLoading || isGlobalTab(activeTab);

  return (
    <div className="space-y-6">
      {/* Title (UsersListClient style) */}
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Site Ayarları</h1>
        <p className="text-sm text-muted-foreground">
          Key-value ayarları. “Liste (Dil)” seçili locale’e göre; “Liste (Global *)” sadece{' '}
          <code>*</code> kayıtlarını gösterir. Global tab’larda locale seçimi kullanılmaz.
        </p>
      </div>

      {/* Tabs (no bootstrap) */}
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as SettingsTab)}>
        <TabsList className="flex flex-wrap justify-start">
          {TAB_ITEMS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filters Card (UsersListClient style) */}
      <Card>
        <CardHeader className="gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base">Filtreler</CardTitle>
              <CardDescription>Arama, locale ve yenileme.</CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {isGlobalTab(activeTab) ? <Badge variant="secondary">Global</Badge> : null}
              {!isGlobalTab(activeTab) && locale ? (
                <Badge variant="secondary">{locale}</Badge>
              ) : null}
              {loading ? <Badge variant="outline">Yükleniyor…</Badge> : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="site-settings-q">Ara</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="site-settings-q"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Key veya değer içinde ara"
                  className="pl-9"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="w-full space-y-2 lg:w-56">
              <Label>Dil</Label>
              <Select
                value={locale || ''}
                onValueChange={(v) => onLocaleChange(v)}
                disabled={localeDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={localeDisabled ? 'Global' : 'Dil seç'} />
                </SelectTrigger>
                <SelectContent>
                  {(locales ?? []).map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {localeDisabled ? (
                <div className="text-xs text-muted-foreground">
                  Bu sekmede locale seçimi devre dışıdır.
                </div>
              ) : null}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onRefresh}
                disabled={loading}
                title="Yenile"
              >
                <RefreshCcw className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

SiteSettingsHeader.displayName = 'SiteSettingsHeader';
