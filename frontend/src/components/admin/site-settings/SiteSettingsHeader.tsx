// =============================================================
// FILE: src/components/admin/site-settings/SiteSettingsHeader.tsx
// =============================================================

import React from 'react';
import { AdminLocaleSelect, type AdminLocaleOption } from '@/components/common/AdminLocaleSelect';

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

export type SettingsScope = 'localized' | 'global' | 'mixed';

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
  const options = (locales ?? []) as AdminLocaleOption[];

  const isLocaleDisabled =
    loading ||
    !!localesLoading ||
    activeTab === 'global_list' ||
    activeTab === 'smtp' ||
    activeTab === 'cloudinary' ||
    activeTab === 'brand_media' ||
    activeTab === 'api';

  return (
    <div className="row mb-3">
      <div className="col-12 col-lg-7 mb-2 mb-lg-0">
        <h1 className="h4 mb-1">Site Ayarları</h1>
        <p className="text-muted small mb-2">
          Key-value ayarları. “Liste (Dil)” seçili locale’e göre; “Liste (Global *)” sadece locale=
          {<code>*</code>} satırlarını gösterir. Global tab’larda locale seçimi kullanılmaz.
        </p>

        <div className="btn-group btn-group-sm flex-wrap" role="group">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={
                'btn btn-sm me-1 mb-1 ' +
                (activeTab === tab.id ? 'btn-primary' : 'btn-outline-primary')
              }
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="col-12 col-lg-5 d-flex align-items-end justify-content-lg-end">
        <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-sm-auto">
          <div className="input-group input-group-sm">
            <span className="input-group-text">Ara</span>
            <input
              type="text"
              className="form-control"
              placeholder="Key veya değer içinde ara"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={loading}
            />
          </div>

          <AdminLocaleSelect
            value={locale}
            onChange={onLocaleChange}
            options={options}
            loading={!!localesLoading}
            disabled={isLocaleDisabled}
          />

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={onRefresh}
            disabled={loading}
          >
            Yenile
          </button>
        </div>
      </div>
    </div>
  );
};
