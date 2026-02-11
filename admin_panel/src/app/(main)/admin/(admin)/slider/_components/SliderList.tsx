'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/slider/_components/SliderList.tsx
// Admin Slider List (shadcn/tailwind)
// - No bootstrap
// - Reorder: Up/Down stable (enabled if onReorder provided)
// - Responsive: Table (md+) + cards (mobile)
// =============================================================

import * as React from 'react';
import type { SliderAdminDto } from '@/integrations/shared';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { ArrowUp, ArrowDown, Pencil, Trash2 } from 'lucide-react';

const safeText = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const normLocale = (v: unknown) =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

const clip = (v: unknown, max = 80) => {
  const s = safeText(v);
  if (!s) return '';
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 3)) + '...';
};

export type SliderListProps = {
  items: SliderAdminDto[];
  loading: boolean;

  onEdit: (item: SliderAdminDto) => void;
  onDelete: (item: SliderAdminDto) => void;

  onToggleActive: (item: SliderAdminDto, value: boolean) => void;
  onToggleFeatured: (item: SliderAdminDto, value: boolean) => void;

  onReorder?: (next: SliderAdminDto[]) => void;
  onSaveOrder?: () => void;
  savingOrder?: boolean;
};

function Thumb({ item, t }: { item: SliderAdminDto; t: any }) {
  const img =
    (item as any)?.image_effective_url || (item as any)?.image_url || (item as any)?.image || '';
  if (!img) return <Badge variant="outline">{t('admin.slider.list.noImage')}</Badge>;

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={img}
      alt={safeText((item as any)?.alt) || safeText((item as any)?.name) || 'slider'}
      className="h-10 w-16 rounded-md border object-cover"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

export function SliderList({
  items,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleFeatured,
  onReorder,
  onSaveOrder,
  savingOrder,
}: SliderListProps) {
  const t = useAdminT();

  const rows = items ?? [];
  const totalItems = rows.length;
  const hasData = totalItems > 0;

  const busy = loading || !!savingOrder;
  const canReorder = !!onReorder && !busy;

  const move = (fromIdx: number, delta: -1 | 1) => {
    if (!onReorder) return;
    const to = fromIdx + delta;
    if (to < 0 || to >= rows.length) return;

    const next = rows.slice();
    const [moved] = next.splice(fromIdx, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  };

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base">{t('admin.slider.list.title')}</CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            {busy ? <Badge variant="secondary">{t('admin.slider.list.processing')}</Badge> : null}

            <span className="text-sm text-muted-foreground">
              {t('admin.slider.list.totalLabel')} <span className="font-medium text-foreground">{totalItems}</span>
            </span>

            {onSaveOrder ? (
              <Button
                variant="outline"
                size="sm"
                disabled={!hasData || !!savingOrder || loading}
                onClick={onSaveOrder}
              >
                {savingOrder ? t('admin.slider.list.savingOrder') : t('admin.slider.list.saveOrderButton')}
              </Button>
            ) : null}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {t('admin.slider.list.reorderHelp')}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Desktop */}
        <div className="hidden rounded-md border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14" />
                <TableHead className="w-20">{t('admin.slider.list.imageColumn')}</TableHead>
                <TableHead>{t('admin.slider.list.titleColumn')}</TableHead>
                <TableHead className="w-20">{t('admin.slider.list.localeColumn')}</TableHead>
                <TableHead className="w-44">{t('admin.slider.list.slugColumn')}</TableHead>
                <TableHead className="w-28 text-center">{t('admin.slider.list.activeColumn')}</TableHead>
                <TableHead className="w-32 text-center">{t('admin.slider.list.featuredColumn')}</TableHead>
                <TableHead className="w-24 text-center">{t('admin.slider.list.orderColumn')}</TableHead>
                <TableHead className="w-60 text-right">{t('admin.slider.list.actionsColumn')}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {hasData ? (
                rows.map((item, idx) => {
                  const id = String((item as any).id);
                  const name = safeText((item as any).name) || t('admin.slider.list.noTitle');
                  const slug = safeText((item as any).slug) || '-';
                  const desc = safeText((item as any).description);
                  const btnText = safeText((item as any).buttonText);
                  const btnLink = safeText((item as any).buttonLink);
                  const locale = normLocale((item as any).locale || 'de') || 'de';

                  return (
                    <TableRow key={id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {canReorder ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => move(idx, -1)}
                              disabled={!canReorder || idx === 0}
                              title={t('admin.slider.list.upButton')}
                            >
                              <ArrowUp className="size-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => move(idx, 1)}
                              disabled={!canReorder || idx === rows.length - 1}
                              title={t('admin.slider.list.downButton')}
                            >
                              <ArrowDown className="size-4" />
                            </Button>
                          </div>
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center">
                          <Thumb item={item} t={t} />
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-normal">
                        <div className="text-sm font-medium">{name}</div>

                        {desc ? (
                          <div className="text-xs text-muted-foreground">{clip(desc, 140)}</div>
                        ) : null}

                        {btnText ? (
                          <div className="text-xs text-muted-foreground">
                            {t('admin.slider.list.buttonLabel')}{' '}
                            <span className="font-medium text-foreground">{clip(btnText, 40)}</span>
                          </div>
                        ) : null}

                        {btnLink ? (
                          <div className="text-xs text-muted-foreground">
                            {t('admin.slider.list.linkLabel')} <code className="text-xs">{clip(btnLink, 90)}</code>
                          </div>
                        ) : null}
                      </TableCell>

                      <TableCell>
                        <code className="text-xs">{locale}</code>
                      </TableCell>

                      <TableCell className="whitespace-normal">
                        <code className="text-xs">{clip(slug, 80) || '-'}</code>
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => onToggleActive(item, !(item as any).is_active)}
                        >
                          {(item as any).is_active ? t('admin.slider.list.activeStatus') : t('admin.slider.list.inactiveStatus')}
                        </Button>
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => onToggleFeatured(item, !(item as any).featured)}
                        >
                          {(item as any).featured ? t('admin.slider.list.featuredStatus') : t('admin.slider.list.normalStatus')}
                        </Button>
                      </TableCell>

                      <TableCell className="text-center text-sm">
                        {(item as any).display_order ?? 0}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(item)}
                            disabled={busy}
                          >
                            <Pencil className="mr-2 size-4" />
                            {t('admin.slider.list.editButton')}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(item)}
                            disabled={busy}
                            className="border-destructive text-destructive hover:text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" />
                            {t('admin.slider.list.deleteButton')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {loading ? t('admin.slider.list.loading') : t('admin.slider.list.noRecords')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile */}
        <div className="md:hidden rounded-md border divide-y">
          {hasData ? (
            rows.map((item, idx) => {
              const id = String((item as any).id);
              const name = safeText((item as any).name) || t('admin.slider.list.noTitle');
              const slug = safeText((item as any).slug) || '-';
              const desc = safeText((item as any).description);
              const btnText = safeText((item as any).buttonText);
              const btnLink = safeText((item as any).buttonLink);
              const locale = normLocale((item as any).locale || 'de') || 'de';

              return (
                <div key={id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        #{idx + 1} {name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('admin.slider.list.localeLabel')} <code className="text-xs">{locale}</code> · {t('admin.slider.list.orderLabel')}{' '}
                        <span className="font-medium text-foreground">
                          {(item as any).display_order ?? 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Thumb item={item} t={t} />
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {t('admin.slider.list.slugLabel')} <code className="text-xs">{clip(slug, 110) || '-'}</code>
                  </div>

                  {desc ? <div className="text-sm">{clip(desc, 180)}</div> : null}

                  {btnText ? (
                    <div className="text-xs text-muted-foreground">
                      {t('admin.slider.list.buttonLabel')} <span className="font-medium text-foreground">{clip(btnText, 60)}</span>
                    </div>
                  ) : null}

                  {btnLink ? (
                    <div className="text-xs text-muted-foreground">
                      {t('admin.slider.list.linkLabel')} <code className="text-xs">{clip(btnLink, 120)}</code>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => onToggleActive(item, !(item as any).is_active)}
                    >
                      {(item as any).is_active ? t('admin.slider.list.activeStatus') : t('admin.slider.list.inactiveStatus')}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => onToggleFeatured(item, !(item as any).featured)}
                    >
                      {(item as any).featured ? t('admin.slider.list.featuredStatus') : t('admin.slider.list.normalStatus')}
                    </Button>
                  </div>

                  {canReorder ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => move(idx, -1)}
                        disabled={!canReorder || idx === 0}
                      >
                        <ArrowUp className="mr-2 size-4" />
                        {t('admin.slider.list.upButton')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => move(idx, 1)}
                        disabled={!canReorder || idx === rows.length - 1}
                      >
                        <ArrowDown className="mr-2 size-4" />
                        {t('admin.slider.list.downButton')}
                      </Button>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(item)}
                      disabled={busy}
                    >
                      <Pencil className="mr-2 size-4" />
                      {t('admin.slider.list.editButton')}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(item)}
                      disabled={busy}
                      className="border-destructive text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-2 size-4" />
                      {t('admin.slider.list.deleteButton')}
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {loading ? t('admin.slider.list.loading') : t('admin.slider.list.noRecords')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
