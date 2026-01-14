// =============================================================
// FILE: src/components/admin/site-settings/SiteSettingsForm.tsx
// konigsmassage – Site Settings Unified Form
// FIX: Raw mode tek editor (textarea) + json parse fallback
// FIX: Structured mode ayrı state
// FIX: Image upload supports open library (no full reload)
// =============================================================

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/router';

import type { SiteSetting, SettingValue } from '@/integrations/types';
import { AdminImageUploadField } from '@/components/common/AdminImageUploadField';

/* ----------------------------- types ----------------------------- */

export type SiteSettingsFormMode = 'structured' | 'raw';

export type SiteSettingsFormProps = {
  settingKey: string;
  locale: string;
  row?: SiteSetting | null;
  disabled?: boolean;
  initialMode?: SiteSettingsFormMode;

  onSave: (args: { key: string; locale: string; value: SettingValue }) => Promise<void>;
  onDelete?: (args: { key: string; locale?: string }) => Promise<void>;

  renderStructured?: (ctx: {
    key: string;
    locale: string;
    value: any;
    setValue: (next: any) => void;
    disabled?: boolean;
  }) => React.ReactNode;

  showImageUpload?: boolean;

  imageUpload?: {
    label?: string;
    helperText?: React.ReactNode;
    bucket?: string;
    folder?: string;
    metadata?: Record<string, string | number | boolean>;
    value?: string;
    onChange?: (url: string) => void;

    /** optional: open storage library */
    openLibraryHref?: string;
    onOpenLibraryClick?: () => void;
  };
};

/* ----------------------------- helpers ----------------------------- */

export function coerceSettingValue(input: any): any {
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

function prettyStringify(v: any) {
  try {
    return JSON.stringify(v ?? {}, null, 2);
  } catch {
    return '';
  }
}

function parseRawOrString(text: string): SettingValue {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return null;

  // JSON dene; olmazsa string
  try {
    return JSON.parse(trimmed) as any;
  } catch {
    return trimmed;
  }
}

/* ----------------------------- component ----------------------------- */

export const SiteSettingsForm: React.FC<SiteSettingsFormProps> = ({
  settingKey,
  locale,
  row,
  disabled,
  initialMode = 'structured',
  onSave,
  onDelete,
  renderStructured,
  showImageUpload,
  imageUpload,
}) => {
  const router = useRouter();

  const [mode, setMode] = useState<SiteSettingsFormMode>(initialMode);

  // structured
  const [structuredValue, setStructuredValue] = useState<any>({});

  // raw
  const [rawText, setRawText] = useState<string>('');

  const coercedInitial = useMemo(() => coerceSettingValue(row?.value), [row?.value]);

  // sync on key/locale/row change
  useEffect(() => {
    setStructuredValue(coercedInitial ?? {});
    // raw text: eğer DB string ise aynen göster; değilse pretty JSON
    if (typeof row?.value === 'string') setRawText(row.value ?? '');
    else setRawText(prettyStringify(coercedInitial));
  }, [coercedInitial, row?.value, settingKey, locale]);

  const canStructured = typeof renderStructured === 'function';

  // Mode guard: structured renderer yoksa raw’a düş
  useEffect(() => {
    if (mode === 'structured' && !canStructured) setMode('raw');
  }, [mode, canStructured]);

  const handleSave = async () => {
    if (disabled) return;

    try {
      const valueToSave: SettingValue =
        mode === 'raw' ? parseRawOrString(rawText) : (structuredValue as any);

      await onSave({ key: settingKey, locale, value: valueToSave });

      toast.success(`"${settingKey}" (${locale}) kaydedildi.`);
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || 'Kaydetme sırasında hata oluştu.';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || disabled) return;

    const ok = window.confirm(`"${settingKey}" (${locale}) silinsin mi?`);
    if (!ok) return;

    try {
      await onDelete({ key: settingKey, locale });
      toast.success(`"${settingKey}" (${locale}) silindi.`);
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || 'Silme sırasında hata oluştu.';
      toast.error(msg);
    }
  };

  const openLibraryHref = imageUpload?.openLibraryHref ?? '/admin/storage';
  const onOpenLibraryClick =
    imageUpload?.onOpenLibraryClick ?? (() => router.push(openLibraryHref));

  return (
    <div className="card">
      <div className="card-header py-2 d-flex justify-content-between align-items-center">
        <div className="d-flex flex-column">
          <div className="small fw-semibold">
            Ayar: <code>{settingKey}</code>
            <span className="badge bg-light text-dark border ms-2">{locale}</span>
          </div>
          <div className="text-muted small">
            Structured mod: form bileşeni. Raw mod: JSON veya düz string.
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm"
            style={{ width: 160 }}
            value={mode}
            onChange={(e) => setMode(e.target.value as SiteSettingsFormMode)}
            disabled={disabled}
          >
            <option value="structured" disabled={!canStructured}>
              Structured
            </option>
            <option value="raw">Raw</option>
          </select>

          {onDelete && (
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={handleDelete}
              disabled={disabled}
            >
              Sil
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={disabled}
          >
            Kaydet
          </button>
        </div>
      </div>

      <div className="card-body">
        {showImageUpload && (
          <div className="mb-3">
            <AdminImageUploadField
              label={imageUpload?.label ?? 'Görsel'}
              helperText={imageUpload?.helperText}
              bucket={imageUpload?.bucket ?? 'public'}
              folder={imageUpload?.folder ?? 'uploads'}
              metadata={imageUpload?.metadata}
              value={(imageUpload?.value ?? '') as any}
              onChange={(url) => imageUpload?.onChange?.(url)}
              disabled={disabled}
              openLibraryHref={openLibraryHref}
              onOpenLibraryClick={onOpenLibraryClick}
            />
          </div>
        )}

        {mode === 'structured' ? (
          canStructured ? (
            <div>
              {renderStructured?.({
                key: settingKey,
                locale,
                value: structuredValue,
                setValue: setStructuredValue,
                disabled,
              })}

              <div className="mt-3">
                <div className="text-muted small">Structured state (debug)</div>
                <pre className="bg-light border rounded-2 p-2 small mb-0">
                  {prettyStringify(structuredValue)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="alert alert-warning small mb-0">
              Bu key için structured renderer tanımlı değil. Raw modunu kullan.
            </div>
          )
        ) : (
          <div>
            <div className="text-muted small mb-2">
              Raw: Geçerli JSON girersen parse edilerek kaydedilir; değilse düz string kaydedilir.
            </div>
            <textarea
              className="form-control form-control-sm font-monospace"
              rows={14}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              disabled={disabled}
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};

SiteSettingsForm.displayName = 'SiteSettingsForm';
