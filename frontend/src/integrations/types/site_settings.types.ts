// =============================================================
// FILE: src/integrations/types/site_settings.types.ts
// konigsmassage – minimal site_settings tipleri (single source of truth)
// =============================================================

export type ValueType = 'string' | 'number' | 'boolean' | 'json';

/**
 * Backend’den gelen value tipi (JSON parse edilmiş varsayılır)
 * - string | number | boolean | object | array | null
 */
export type SettingValue =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | Array<unknown>
  | null;

/**
 * konigsmassage: site_settings tablosu için kanonik satır tipi
 */
export type SiteSettingRow = {
  id?: string;
  key: string;
  locale?: string; // backend bazı uçlarda locale döndürür
  value: SettingValue;
  created_at?: string;
  updated_at?: string;
};

/**
 * Backward-compat aliases:
 * Bazı sayfalar "SiteSetting" adını bekliyor.
 */
export type SiteSetting = SiteSettingRow;

/**
 * /site_settings/app-locales ve /site-settings/app-locales
 */
export type AppLocaleMeta = {
  code: string;
  label?: string;
  is_default?: boolean;
  is_active?: boolean;
};

/**
 * Backward-compat aliases:
 * Bazı yerlerde "AppLocaleItem" adı kullanılıyor.
 */
export type AppLocaleItem = AppLocaleMeta;

/**
 * /site_settings/default-locale ve /site-settings/default-locale
 */
export type DefaultLocaleMeta = string | null;

/* -------------------------------------------------------------
 * Eğer Topbar / EmailTemplate hâlâ projede kullanılıyorsa kalsın.
 * ------------------------------------------------------------- */

export type TopbarSettingRow = {
  id: string;
  is_active: boolean | 0 | 1;
  message: string;
  coupon_code?: string | null;
  link_url?: string | null;
  link_text?: string | null;
  show_ticker?: boolean | 0 | 1;
  created_at?: string;
  updated_at?: string;
};

export type EmailTemplateRow = {
  id: string;
  template_key: string;
  template_name: string;
  subject: string;
  content: string; // HTML
  variables: string[];
  is_active: boolean | 0 | 1;
  created_at?: string;
  updated_at?: string;
};
