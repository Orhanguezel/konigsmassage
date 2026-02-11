'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/site-settings/_components/SiteSettingsList.tsx
// guezelwebdesign – Site Ayarları Liste Bileşeni (shadcn/ui)
// - FIX: Hide SEO keys in global(*) list.
// - UI: Card + Table (desktop), Card list (mobile)
// - FIX: <a href> => next/link (no full reload)
// - Preview fallback -> object/array OR string(JSON) => JSON preview
// - NO inline styles
// =============================================================

import * as React from 'react';
import Link from 'next/link';
import type { SiteSetting, SettingValue } from '@/integrations/shared';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/* ----------------------------- helpers ----------------------------- */

function isSeoKey(key: string): boolean {
  const k = String(key || '')
    .trim()
    .toLowerCase();
  if (!k) return false;

  return (
    k === 'seo' ||
    k === 'site_seo' ||
    k === 'site_meta_default' ||
    k.startsWith('seo_') ||
    k.startsWith('seo|') ||
    k.startsWith('site_seo|') ||
    k.startsWith('ui_seo') ||
    k.startsWith('ui_seo_')
  );
}

/**
 * Some rows may store JSON as string in DB.
 * For list preview, attempt to parse if it "looks like JSON".
 */
function coercePreviewValue(input: SettingValue): SettingValue {
  if (input === null || input === undefined) return input;

  if (typeof input === 'object') return input;

  if (typeof input === 'string') {
    const s = input.trim();
    if (!s) return input;

    const looksJson =
      (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));

    if (!looksJson) return input;

    try {
      return JSON.parse(s) as any;
    } catch {
      return input;
    }
  }

  return input;
}

function formatValuePreview(v: SettingValue): string {
  const vv = coercePreviewValue(v);
  if (vv === null || vv === undefined) return '—';

  // Primitive values
  if (typeof vv === 'string') {
    const s = vv.trim();
    if (s.length <= 80) return s;
    return `${s.slice(0, 77)}...`;
  }

  if (typeof vv === 'number' || typeof vv === 'boolean') return String(vv);

  // Arrays
  if (Array.isArray(vv)) {
    if (vv.length === 0) return '[]';
    return `Array [${vv.length} items]`;
  }

  // Objects
  if (typeof vv === 'object') {
    const keys = Object.keys(vv);
    if (keys.length === 0) return '{}';
    if (keys.length <= 3) return `{ ${keys.join(', ')} }`;
    return `Object {${keys.length} fields}`;
  }

  // Fallback
  try {
    const s = JSON.stringify(vv);
    if (s.length <= 80) return s;
    return `${s.slice(0, 77)}...`;
  } catch {
    return String(vv as any);
  }
}

function formatDate(v?: string | null): string {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleString();
  } catch {
    return '—';
  }
}

/* ----------------------------- types ----------------------------- */

export type SiteSettingsListProps = {
  settings?: SiteSetting[];
  loading: boolean;

  onEdit?: (setting: SiteSetting) => void;
  onDelete?: (setting: SiteSetting) => void;

  /**
   * Edit action can be a link.
   * Example: (s) => `/admin/site-settings/${encodeURIComponent(s.key)}?locale=${selectedLocale}`
   */
  getEditHref?: (setting: SiteSetting) => string;

  selectedLocale: string; // 'en' | 'de' | '*'
};

/* ----------------------------- component ----------------------------- */

export const SiteSettingsList: React.FC<SiteSettingsListProps> = ({
  settings,
  loading,
  onEdit,
  onDelete,
  getEditHref,
  selectedLocale,
}) => {
  const filtered = React.useMemo(() => {
    const arr = Array.isArray(settings) ? settings : [];
    if (selectedLocale === '*') return arr.filter((s) => s && !isSeoKey(s.key));
    return arr;
  }, [settings, selectedLocale]);

  const hasData = filtered.length > 0;

  const renderEditAction = (s: SiteSetting) => {
    const href = getEditHref?.(s);

    if (href) {
      return (
        <Button asChild variant="outline" size="sm">
          <Link prefetch={false} href={href}>
            Düzenle
          </Link>
        </Button>
      );
    }

    if (onEdit) {
      return (
        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(s)}>
          Düzenle
        </Button>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">Ayar Listesi</CardTitle>
            <CardDescription className="text-sm">
              <span className="text-muted-foreground">
                <code>site_settings</code> kayıtları
              </span>{' '}
              <span className="text-muted-foreground">
                (<span className="font-medium text-foreground">{selectedLocale || '—'}</span>)
              </span>
              {selectedLocale === '*' ? (
                <span className="text-muted-foreground">
                  {' '}
                  • SEO anahtarları bu listede gizlenir; SEO tab’ında yönetilir.
                </span>
              ) : null}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {selectedLocale ? <Badge variant="secondary">{selectedLocale}</Badge> : null}
            {loading ? <Badge variant="outline">Yükleniyor…</Badge> : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ===================== DESKTOP TABLE (md+) ===================== */}
        <div className="hidden md:block">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%]">Key</TableHead>
                  <TableHead className="w-[8%]">Dil</TableHead>
                  <TableHead className="w-[35%]">Değer (Özet)</TableHead>
                  <TableHead className="w-[15%]">Güncellenme</TableHead>
                  <TableHead className="w-[17%] text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {hasData ? (
                  filtered.map((s) => (
                    <TableRow key={`${s.key}_${s.locale || 'none'}`}>
                      <TableCell className="align-top font-medium wrap-break-word">
                        {s.key}
                      </TableCell>

                      <TableCell className="align-top">
                        {s.locale ? (
                          <Badge variant="outline">{s.locale}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="align-top">
                        <div className="max-w-md overflow-hidden text-ellipsis text-xs text-muted-foreground">
                          <code className="rounded bg-muted px-1.5 py-0.5">
                            {formatValuePreview(s.value)}
                          </code>
                        </div>
                      </TableCell>

                      <TableCell className="align-top">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(s.updated_at)}
                        </span>
                      </TableCell>

                      <TableCell className="align-top text-right">
                        <div className="inline-flex items-center gap-2">
                          {renderEditAction(s)}
                          {onDelete ? (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => onDelete(s)}
                            >
                              Sil
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Kayıt bulunamadı.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* ===================== MOBILE CARDS (sm and down) ===================== */}
        <div className="md:hidden">
          <div className="rounded-md border">
            {hasData ? (
              <div className="divide-y">
                {filtered.map((s) => {
                  const editAction = renderEditAction(s);
                  return (
                    <div key={`${s.key}_${s.locale || 'none'}`} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium wrap-break-word">{s.key}</div>
                            {s.locale ? <Badge variant="outline">{s.locale}</Badge> : null}
                          </div>

                          <div className="text-xs text-muted-foreground wrap-break-word">
                            {formatValuePreview(s.value)}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Güncellenme: {formatDate(s.updated_at)}
                          </div>
                        </div>
                      </div>

                      {editAction || onDelete ? (
                        <div className="mt-4 grid gap-2">
                          {editAction ? <div className="grid">{editAction}</div> : null}
                          {onDelete ? (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => onDelete(s)}
                            >
                              Sil
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Kayıt bulunamadı.
              </div>
            )}
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            Mobil görünümde kayıtlar kart formatında listelenir.
            {selectedLocale === '*' ? ' SEO anahtarları burada da gizlidir.' : ''}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

SiteSettingsList.displayName = 'SiteSettingsList';
