// =============================================================
// FILE: src/pages/admin/site-settings/index.tsx
// konigsmassage – Site Settings Admin (LIST)
// - Modal edit kaldırıldı
// - Edit action artık /admin/site-settings/[id]?locale=xx sayfasına gider
// =============================================================

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  useListSiteSettingsAdminQuery,
  useDeleteSiteSettingAdminMutation,
  useGetAppLocalesAdminQuery,
  useGetDefaultLocaleAdminQuery,
} from '@/integrations/rtk/hooks';

import {
  SiteSettingsHeader,
  type SettingsTab,
  type LocaleOption,
} from '@/components/admin/site-settings/SiteSettingsHeader';

import { SiteSettingsList } from '@/components/admin/site-settings/SiteSettingsList';

import {
  GeneralSettingsTab,
  SeoSettingsTab,
  SmtpSettingsTab,
  CloudinarySettingsTab,
  ApiSettingsTab,
  BrandMediaTab,
} from '@/components/admin/site-settings/tabs';

import type { AppLocaleItem, SiteSetting } from '@/integrations/types';

type SettingsScope = 'localized' | 'global' | 'mixed';

const TAB_SCOPE: Record<SettingsTab, SettingsScope> = {
  list: 'mixed',
  global_list: 'global',
  general: 'localized',
  seo: 'localized',
  smtp: 'global',
  cloudinary: 'global',
  brand_media: 'global',
  api: 'global',
};

const toShortLocale = (v: unknown): string =>
  String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

function uniqByCode(items: AppLocaleItem[]): AppLocaleItem[] {
  const seen = new Set<string>();
  const out: AppLocaleItem[] = [];
  for (const it of items) {
    const code = toShortLocale(it?.code);
    if (!code) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    out.push({ ...it, code });
  }
  return out;
}

function buildLocaleLabel(item: AppLocaleItem): string {
  const code = toShortLocale(item.code);
  const label = String(item.label || '').trim();
  return label ? `${label} (${code})` : code.toUpperCase();
}

const SiteSettingsAdminPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<SettingsTab>('list');
  const [selectedLocale, setSelectedLocale] = useState<string>('');

  const {
    data: appLocalesItems,
    isLoading: isLocalesLoading,
    isFetching: isLocalesFetching,
  } = useGetAppLocalesAdminQuery();

  const {
    data: defaultLocaleRaw,
    isLoading: isDefaultLoading,
    isFetching: isDefaultFetching,
  } = useGetDefaultLocaleAdminQuery();

  const activeLocales: AppLocaleItem[] = useMemo(() => {
    const items = Array.isArray(appLocalesItems) ? appLocalesItems : [];
    const active = items.filter((x) => !!x && !!x.code && x.is_active !== false);
    return uniqByCode(active);
  }, [appLocalesItems]);

  const localeOptions: LocaleOption[] = useMemo(
    () =>
      activeLocales.map((it) => ({
        value: toShortLocale(it.code),
        label: buildLocaleLabel(it),
      })),
    [activeLocales],
  );

  const defaultLocale = useMemo(() => toShortLocale(defaultLocaleRaw), [defaultLocaleRaw]);

  useEffect(() => {
    if (!localeOptions.length) return;

    if (selectedLocale && localeOptions.some((x) => x.value === selectedLocale)) return;

    if (defaultLocale && localeOptions.some((x) => x.value === defaultLocale)) {
      setSelectedLocale(defaultLocale);
      return;
    }

    setSelectedLocale(localeOptions[0].value);
  }, [localeOptions, selectedLocale, defaultLocale]);

  const effectiveLocaleForTab = useMemo(() => {
    const scope = TAB_SCOPE[activeTab] ?? 'mixed';
    if (scope === 'global') return '*';
    return selectedLocale || undefined;
  }, [activeTab, selectedLocale]);

  // ✅ LIST query only when we are on list / global_list
  const listArgs = useMemo(() => {
    const isListTab = activeTab === 'list' || activeTab === 'global_list';
    if (!isListTab) return undefined;

    const q = search?.trim() || undefined;
    if (!effectiveLocaleForTab) return undefined;

    return { q, locale: effectiveLocaleForTab };
  }, [activeTab, search, effectiveLocaleForTab]);

  const {
    data: settings,
    isLoading: isListLoading,
    isFetching: isListFetching,
    refetch: refetchList,
  } = useListSiteSettingsAdminQuery(listArgs, { skip: !listArgs });

  const [deleteSetting, { isLoading: isDeleting }] = useDeleteSiteSettingAdminMutation();

  const busy =
    isListLoading ||
    isListFetching ||
    isDeleting ||
    isLocalesLoading ||
    isLocalesFetching ||
    isDefaultLoading ||
    isDefaultFetching;

  const onRefresh = async () => {
    if (listArgs) {
      await refetchList();
      return;
    }
    // list dışındaysan, tab component’leri kendi refetch’ini yönetiyor zaten
    toast.message('Bu tab kendi içinde yenileme yapar. Liste tabında “Yenile” listeyi günceller.');
  };

  const handleDelete = async (setting: SiteSetting) => {
    const key = setting.key;
    const delAll = window.confirm(
      `"${key}" anahtarı için TÜM dillerdeki kayıtlar silinsin mi?\n\nOK: Tüm diller\nCancel: Sadece bu satırın dili`,
    );

    try {
      if (delAll) {
        await deleteSetting({ key }).unwrap();
      } else {
        const scope = TAB_SCOPE[activeTab] ?? 'mixed';
        const loc =
          toShortLocale(setting.locale) || (scope === 'global' ? '*' : '') || selectedLocale;

        if (!loc) {
          toast.error('Tek dil silmek için locale bulunamadı.');
          return;
        }

        await deleteSetting({ key, locale: loc }).unwrap();
      }

      toast.success(`"${key}" ayarı silindi.`);
      if (listArgs) await refetchList();
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || 'Ayar silinirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  const getEditHref = (s: SiteSetting) => {
    const scope = TAB_SCOPE[activeTab] ?? 'mixed';

    // global tablarda locale her zaman '*'
    if (scope === 'global') {
      return `/admin/site-settings/${encodeURIComponent(s.key)}?locale=*`;
    }

    // mixed/localized: satırın locale’i varsa onu, yoksa seçili locale’i kullan
    const loc = toShortLocale(s.locale) || selectedLocale || '';
    return `/admin/site-settings/${encodeURIComponent(s.key)}?locale=${encodeURIComponent(loc)}`;
  };

  return (
    <div className="container-fluid py-4">
      <SiteSettingsHeader
        search={search}
        onSearchChange={setSearch}
        locale={selectedLocale}
        onLocaleChange={setSelectedLocale}
        loading={busy}
        onRefresh={onRefresh}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        locales={localeOptions}
        localesLoading={
          isLocalesLoading || isLocalesFetching || isDefaultLoading || isDefaultFetching
        }
      />

      <div className="row">
        <div className="col-12">
          {(activeTab === 'list' || activeTab === 'global_list') && (
            <SiteSettingsList
              settings={settings}
              loading={busy}
              onDelete={handleDelete}
              getEditHref={getEditHref}
              selectedLocale={activeTab === 'global_list' ? '*' : selectedLocale}
            />
          )}

          {activeTab === 'general' && selectedLocale && (
            <GeneralSettingsTab locale={selectedLocale} />
          )}
          {activeTab === 'seo' && selectedLocale && <SeoSettingsTab locale={selectedLocale} />}

          {activeTab === 'smtp' && <SmtpSettingsTab locale="*" />}
          {activeTab === 'cloudinary' && <CloudinarySettingsTab locale="*" />}
          {activeTab === 'brand_media' && <BrandMediaTab />}
          {activeTab === 'api' && <ApiSettingsTab locale="*" />}
        </div>
      </div>
    </div>
  );
};

export default SiteSettingsAdminPage;
