// =============================================================
// FILE: src/components/admin/site-settings/structured/SeoStructuredForm.tsx
// konigsmassage – Site Settings (SEO) Structured Form (NO MODAL)
// - Used by /admin/site-settings/[id].tsx via renderStructured
// - Uses AdminImageUploadField for OG image upload helper
// =============================================================

'use client';

import React, { useMemo } from 'react';

import { AdminImageUploadField } from '@/components/common/AdminImageUploadField';
import type { SettingValue } from '@/integrations/types';

/* ----------------------------- types ----------------------------- */

export type SeoStructured = {
  site_name?: string;
  title_default?: string;
  title_template?: string;
  description?: string;

  open_graph?: {
    type?: 'website' | 'article' | 'product';
    images?: string[];
  };

  twitter?: {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player';
    site?: string;
    creator?: string;
  };

  robots?: {
    noindex?: boolean;
    index?: boolean;
    follow?: boolean;
  };
};

export type SeoStructuredFormProps = {
  settingKey: string;
  locale: string;
  value: SettingValue;
  setValue: (next: any) => void;
  disabled?: boolean;
};

/* ----------------------------- helpers ----------------------------- */

function coerceSettingValue(input: any): any {
  if (input === null || input === undefined) return input;
  if (typeof input === 'object') return input;

  if (typeof input === 'string') {
    const s = input.trim();
    if (!s) return input;

    const looksJson =
      (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));

    if (!looksJson) return input;

    try {
      return JSON.parse(s);
    } catch {
      return input;
    }
  }

  return input;
}

function normalizeSeo(obj: any): SeoStructured {
  const o = obj && typeof obj === 'object' ? obj : {};
  const images = Array.isArray(o?.open_graph?.images) ? o.open_graph.images : [];

  return {
    site_name: String(o.site_name ?? ''),
    title_default: String(o.title_default ?? ''),
    title_template: String(o.title_template ?? ''),
    description: String(o.description ?? ''),

    open_graph: {
      type: (o?.open_graph?.type ?? 'website') as any,
      images: images.map((x: any) => String(x ?? '')).filter(Boolean),
    },

    twitter: {
      card: (o?.twitter?.card ?? 'summary_large_image') as any,
      site: String(o?.twitter?.site ?? ''),
      creator: String(o?.twitter?.creator ?? ''),
    },

    robots: {
      noindex: Boolean(o?.robots?.noindex),
      index: o?.robots?.index !== false, // default true
      follow: o?.robots?.follow !== false, // default true
    },
  };
}

function uniqStrings(arr: string[]) {
  return Array.from(new Set(arr.map((x) => String(x || '').trim()).filter(Boolean)));
}

/* ----------------------------- component ----------------------------- */

export const SeoStructuredForm: React.FC<SeoStructuredFormProps> = ({
  settingKey,
  locale,
  value,
  setValue,
  disabled,
}) => {
  const v = useMemo(() => normalizeSeo(coerceSettingValue(value)), [value]);

  const set = (patch: Partial<SeoStructured>) => {
    setValue({
      ...v,
      ...patch,
    });
  };

  const ogImagesText = (v.open_graph?.images || []).join('\n');

  const setOpenGraph = (patch: Partial<NonNullable<SeoStructured['open_graph']>>) => {
    set({
      open_graph: {
        ...(v.open_graph || {}),
        ...patch,
      },
    });
  };

  const setTwitter = (patch: Partial<NonNullable<SeoStructured['twitter']>>) => {
    set({
      twitter: {
        ...(v.twitter || {}),
        ...patch,
      },
    });
  };

  const setRobots = (patch: Partial<NonNullable<SeoStructured['robots']>>) => {
    set({
      robots: {
        ...(v.robots || {}),
        ...patch,
      },
    });
  };

  return (
    <div>
      <div className="alert alert-info small py-2">
        Structured edit: SEO alanlarını form olarak yönetir. Kaydetme sırasında backend tarafında
        strict doğrulama uygulanıyorsa hatalı yapı kaydedilmez.
        <div className="mt-1">
          <strong>Not:</strong> Robots’ta <code>noindex</code> true ise arama motorlarına indeksleme
          önerilmez.
        </div>
      </div>

      {/* Optional helper upload */}
      <div className="mb-3">
        <AdminImageUploadField
          label="OpenGraph Görsel Yükle (opsiyonel)"
          folder="seo"
          bucket="public"
          metadata={{
            module_key: 'seo',
            locale: String(locale),
            key: String(settingKey),
          }}
          value={(v.open_graph?.images && v.open_graph.images[0]) || ''}
          onChange={(url) => {
            const merged = uniqStrings([url, ...(v.open_graph?.images || [])]);
            setOpenGraph({ images: merged });
          }}
          disabled={disabled}
        />
      </div>

      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label small">Site Name</label>
          <input
            className="form-control form-control-sm"
            value={v.site_name || ''}
            onChange={(e) => set({ site_name: e.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="col-md-4">
          <label className="form-label small">Title Default</label>
          <input
            className="form-control form-control-sm"
            value={v.title_default || ''}
            onChange={(e) => set({ title_default: e.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="col-md-4">
          <label className="form-label small">Title Template</label>
          <input
            className="form-control form-control-sm"
            value={v.title_template || ''}
            onChange={(e) => set({ title_template: e.target.value })}
            placeholder="%s | konigsmassage"
            disabled={disabled}
          />
        </div>

        <div className="col-12">
          <label className="form-label small">Description</label>
          <textarea
            className="form-control form-control-sm"
            rows={3}
            value={v.description || ''}
            onChange={(e) => set({ description: e.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="col-md-4">
          <label className="form-label small">OpenGraph Type</label>
          <select
            className="form-select form-select-sm"
            value={v.open_graph?.type || 'website'}
            onChange={(e) => setOpenGraph({ type: e.target.value as any })}
            disabled={disabled}
          >
            <option value="website">website</option>
            <option value="article">article</option>
            <option value="product">product</option>
          </select>
        </div>

        <div className="col-md-8">
          <label className="form-label small">OpenGraph Images (1 per line)</label>
          <textarea
            className="form-control font-monospace"
            rows={5}
            value={ogImagesText}
            onChange={(e) => {
              const images = uniqStrings(
                e.target.value
                  .split('\n')
                  .map((x) => x.trim())
                  .filter(Boolean),
              );
              setOpenGraph({ images });
            }}
            placeholder="/img/og-default.jpg"
            disabled={disabled}
          />
        </div>

        <div className="col-md-4">
          <label className="form-label small">Twitter Card</label>
          <select
            className="form-select form-select-sm"
            value={v.twitter?.card || 'summary_large_image'}
            onChange={(e) => setTwitter({ card: e.target.value as any })}
            disabled={disabled}
          >
            <option value="summary_large_image">summary_large_image</option>
            <option value="summary">summary</option>
            <option value="app">app</option>
            <option value="player">player</option>
          </select>
          <div className="form-text small">
            Çoğu site için önerilen: <code>summary_large_image</code>
          </div>
        </div>

        <div className="col-md-4">
          <label className="form-label small">Twitter Site</label>
          <input
            className="form-control form-control-sm"
            value={v.twitter?.site || ''}
            onChange={(e) => setTwitter({ site: e.target.value })}
            placeholder="@konigsmassage"
            disabled={disabled}
          />
        </div>

        <div className="col-md-4">
          <label className="form-label small">Twitter Creator</label>
          <input
            className="form-control form-control-sm"
            value={v.twitter?.creator || ''}
            onChange={(e) => setTwitter({ creator: e.target.value })}
            placeholder="@creator"
            disabled={disabled}
          />
        </div>

        <div className="col-12">
          <label className="form-label small">Robots</label>
          <div className="d-flex gap-3 flex-wrap">
            <label className="form-check small">
              <input
                className="form-check-input"
                type="checkbox"
                checked={Boolean(v.robots?.noindex)}
                onChange={(e) => setRobots({ noindex: e.target.checked })}
                disabled={disabled}
              />
              <span className="ms-1">noindex</span>
            </label>

            <label className="form-check small">
              <input
                className="form-check-input"
                type="checkbox"
                checked={v.robots?.index !== false}
                onChange={(e) => setRobots({ index: e.target.checked })}
                disabled={disabled}
              />
              <span className="ms-1">index</span>
            </label>

            <label className="form-check small">
              <input
                className="form-check-input"
                type="checkbox"
                checked={v.robots?.follow !== false}
                onChange={(e) => setRobots({ follow: e.target.checked })}
                disabled={disabled}
              />
              <span className="ms-1">follow</span>
            </label>
          </div>

          <div className="form-text small">
            Öneri: Normalde <code>noindex=false</code>, <code>index=true</code>,{' '}
            <code>follow=true</code>.
          </div>
        </div>
      </div>
    </div>
  );
};

SeoStructuredForm.displayName = 'SeoStructuredForm';
