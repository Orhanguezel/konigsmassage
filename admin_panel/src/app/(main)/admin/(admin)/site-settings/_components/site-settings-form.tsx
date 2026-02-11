'use client';

// =============================================================
// FILE: src/components/admin/site-settings/SiteSettingsForm.tsx
// guezelwebdesign – Site Settings Unified Form (shadcn/ui)
// - NO bootstrap classes
// - Mode: Tabs (Structured / Raw)
// - Raw: single textarea, JSON parse fallback
// - Structured: separate state
// - Image upload supports open library (no full reload)
// - App Router safe (next/navigation)
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import type { SiteSetting, SettingValue } from '@/integrations/shared';
import { AdminImageUploadField } from '@/app/(main)/admin/_components/common/AdminImageUploadField';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

  try {
    return JSON.parse(trimmed) as any;
  } catch {
    return trimmed;
  }
}

function errMsg(err: any): string {
  return (
    err?.data?.error?.message ||
    err?.data?.message ||
    err?.message ||
    'İşlem sırasında hata oluştu.'
  );
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

  const canStructured = typeof renderStructured === 'function';

  // Mode
  const [mode, setMode] = React.useState<SiteSettingsFormMode>(
    initialMode === 'structured' && !canStructured ? 'raw' : initialMode,
  );

  // structured
  const [structuredValue, setStructuredValue] = React.useState<any>({});

  // raw
  const [rawText, setRawText] = React.useState<string>('');

  const coercedInitial = React.useMemo(() => coerceSettingValue(row?.value), [row?.value]);

  // sync on key/locale/row change
  React.useEffect(() => {
    setStructuredValue(coercedInitial ?? {});
    if (typeof row?.value === 'string') setRawText(row.value ?? '');
    else setRawText(prettyStringify(coercedInitial));
  }, [coercedInitial, row?.value, settingKey, locale]);

  // guard: if structured renderer missing, force raw
  React.useEffect(() => {
    if (mode === 'structured' && !canStructured) setMode('raw');
  }, [mode, canStructured]);

  const openLibraryHref = imageUpload?.openLibraryHref ?? '/admin/storage';
  const onOpenLibraryClick =
    imageUpload?.onOpenLibraryClick ?? (() => router.push(openLibraryHref));

  const handleSave = async () => {
    if (disabled) return;

    try {
      const valueToSave: SettingValue =
        mode === 'raw' ? parseRawOrString(rawText) : (structuredValue as any);

      await onSave({ key: settingKey, locale, value: valueToSave });
      toast.success(`"${settingKey}" (${locale}) kaydedildi.`);
    } catch (err: any) {
      toast.error(errMsg(err) || 'Kaydetme sırasında hata oluştu.');
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
      toast.error(errMsg(err) || 'Silme sırasında hata oluştu.');
    }
  };

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">
              Ayar: <code>{settingKey}</code>
              <Badge variant="secondary" className="ml-2 align-middle">
                {locale}
              </Badge>
            </CardTitle>
            <CardDescription>
              Structured mod: form bileşeni. Raw mod: JSON veya düz string.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onDelete ? (
              <Button type="button" variant="outline" onClick={handleDelete} disabled={disabled}>
                Sil
              </Button>
            ) : null}

            <Button type="button" onClick={handleSave} disabled={disabled}>
              Kaydet
            </Button>
          </div>
        </div>

        {/* Mode tabs */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as SiteSettingsFormMode)}>
          <TabsList className="w-fit">
            <TabsTrigger value="structured" disabled={!canStructured || !!disabled}>
              Structured
            </TabsTrigger>
            <TabsTrigger value="raw" disabled={!!disabled}>
              Raw
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="space-y-4">
        {showImageUpload ? (
          <div>
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
        ) : null}

        {mode === 'structured' ? (
          canStructured ? (
            <div className="space-y-4">
              <div>
                {renderStructured?.({
                  key: settingKey,
                  locale,
                  value: structuredValue,
                  setValue: setStructuredValue,
                  disabled,
                })}
              </div>

              {/* Debug block */}
              <div className="rounded-md border p-4">
                <div className="mb-2 text-xs text-muted-foreground">Structured state (debug)</div>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap wrap-break-word text-xs">
                  {prettyStringify(structuredValue)}
                </pre>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertTitle>Structured renderer yok</AlertTitle>
              <AlertDescription>
                Bu key için structured renderer tanımlı değil. Raw modunu kullanın.
              </AlertDescription>
            </Alert>
          )
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Raw: Geçerli JSON girersen parse edilerek kaydedilir; değilse düz string kaydedilir.
            </div>

            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={14}
              disabled={disabled}
              spellCheck={false}
              className="font-mono"
              placeholder='Örn: {"title":"..."} veya düz metin'
            />

            <div className="text-xs text-muted-foreground">
              İpucu: JSON formatında kaydetmek istiyorsan başı “&#123;” veya “&#91;” ile başlamalı.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

SiteSettingsForm.displayName = 'SiteSettingsForm';
