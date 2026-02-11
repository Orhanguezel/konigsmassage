'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/services/_components/ServicesList.tsx
// - shadcn/tailwind theme
// - NO arbitrary width classes (w-[...]) => canonical only
// =============================================================

import * as React from 'react';
import type { ServiceDto } from '@/integrations/shared';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';

import { ArrowUp, ArrowDown, Pencil, Trash2 } from 'lucide-react';

const PAGE_SIZE = 20;

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function formatType(type: ServiceDto['type'], t: (key: string) => string): string {
  switch (type) {
    case 'maintenance_repair':
      return t('admin.services.types.maintenance_repair');
    case 'modernization':
      return t('admin.services.types.modernization');
    case 'spare_parts_components':
      return t('admin.services.types.spare_parts_components');
    case 'applications_references':
      return t('admin.services.types.applications_references');
    case 'engineering_support':
      return t('admin.services.types.engineering_support');
    case 'production':
      return t('admin.services.types.production');
    case 'other':
    default:
      return t('admin.services.types.other');
  }
}

function formatPrice(price: string | number | null | undefined): string {
  return price != null ? String(price) : '-';
}

export type ServicesListProps = {
  items?: ServiceDto[];
  loading: boolean;

  onToggleActive?: (service: ServiceDto, value: boolean) => void;
  onToggleFeatured?: (service: ServiceDto, value: boolean) => void;
  onEdit?: (service: ServiceDto) => void;
  onDelete?: (service: ServiceDto) => void;

  onReorder?: (next: ServiceDto[]) => void;
  onSaveOrder?: () => void;
  savingOrder?: boolean;
};

export const ServicesList: React.FC<ServicesListProps> = ({
  items,
  loading,
  onToggleActive,
  onToggleFeatured,
  onEdit,
  onDelete,
  onReorder,
  onSaveOrder,
  savingOrder,
}) => {
  const t = useAdminT();
  const rows = items ?? [];
  const totalItems = rows.length;
  const hasData = totalItems > 0;

  const [page, setPage] = React.useState(1);
  const pageCount = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  React.useEffect(() => {
    setPage((p) => Math.min(p, pageCount));
  }, [pageCount]);

  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageRows = rows.slice(startIndex, startIndex + PAGE_SIZE);

  const canReorder = !!onReorder;

  const moveGlobal = (fromGlobalIdx: number, delta: -1 | 1) => {
    if (!onReorder) return;
    const to = fromGlobalIdx + delta;
    if (to < 0 || to >= rows.length) return;

    const next = rows.slice();
    const [moved] = next.splice(fromGlobalIdx, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  };

  const buildPages = () => {
    if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i + 1);
    return [1, '...', currentPage, '...', pageCount] as const;
  };

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base">{t('admin.services.list.title')}</CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            {loading ? <Badge variant="secondary">{t('admin.services.list.loading')}</Badge> : null}
            <span className="text-sm text-muted-foreground">
              {t('admin.services.list.totalLabel')} <span className="font-medium text-foreground">{totalItems}</span>
            </span>

            {onSaveOrder ? (
              <Button
                variant="outline"
                size="sm"
                disabled={!hasData || !!savingOrder}
                onClick={onSaveOrder}
              >
                {savingOrder ? t('admin.services.list.savingOrder') : t('admin.services.list.saveOrderButton')}
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Desktop */}
        <div className="hidden rounded-md border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-14" />
                <TableHead>{t('admin.services.list.serviceColumn')}</TableHead>
                <TableHead className="min-w-32">{t('admin.services.list.typeColumn')}</TableHead>
                <TableHead className="min-w-40">{t('admin.services.list.statusColumn')}</TableHead>
                <TableHead className="min-w-44">{t('admin.services.list.priceColumn')}</TableHead>
                <TableHead className="min-w-56 text-right">{t('admin.services.list.actionsColumnPlural')}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {hasData ? (
                pageRows.map((s, i) => {
                  const globalIdx = startIndex + i;

                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {canReorder ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => moveGlobal(globalIdx, -1)}
                              disabled={loading || globalIdx === 0}
                              title={t('admin.services.list.upButton')}
                            >
                              <ArrowUp className="size-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => moveGlobal(globalIdx, 1)}
                              disabled={loading || globalIdx === rows.length - 1}
                              title={t('admin.services.list.downButton')}
                            >
                              <ArrowDown className="size-4" />
                            </Button>
                          </div>
                        ) : (
                          <span>{globalIdx + 1}</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm font-medium">{s.name || '—'}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.slug ? (
                            <>
                              {t('admin.services.list.slugLabel')} <code className="text-xs">{s.slug}</code>
                            </>
                          ) : (
                            '—'
                          )}
                        </div>
                        {s.locale_resolved ? (
                          <div className="text-xs text-muted-foreground">
                            {t('admin.services.list.localeLabel')} <code className="text-xs">{s.locale_resolved}</code>
                          </div>
                        ) : null}
                      </TableCell>

                      <TableCell className="text-sm">{formatType(s.type, t)}</TableCell>

                      <TableCell className="text-sm">
                        <div className="flex flex-col gap-2">
                          <Badge variant={s.is_active ? 'secondary' : 'destructive'}>
                            {s.is_active ? t('admin.services.list.activeStatus') : t('admin.services.list.inactiveStatus')}
                          </Badge>
                          <Badge variant="secondary">{s.featured ? t('admin.services.list.featuredStatus') : t('admin.services.list.normalStatus')}</Badge>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm">
                        <div>{t('admin.services.list.priceLabel')} {formatPrice(s.price)}</div>
                        <div className="text-xs text-muted-foreground">
                          {t('admin.services.list.dateLabel')} {formatDate(s.created_at)}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          {onToggleFeatured ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onToggleFeatured(s, !s.featured)}
                              disabled={loading}
                            >
                              {s.featured ? t('admin.services.list.makeNormal') : t('admin.services.list.makeFeatured')}
                            </Button>
                          ) : null}

                          {onToggleActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onToggleActive(s, !s.is_active)}
                              disabled={loading}
                            >
                              {s.is_active ? t('admin.services.list.inactiveStatus') : t('admin.services.list.activeStatus')}
                            </Button>
                          ) : null}

                          {onEdit ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEdit(s)}
                              disabled={loading}
                            >
                              <Pencil className="mr-2 size-4" />
                              {t('admin.services.list.editButton')}
                            </Button>
                          ) : null}

                          {onDelete ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDelete(s)}
                              disabled={loading}
                              className="border-destructive text-destructive hover:text-destructive"
                            >
                              <Trash2 className="mr-2 size-4" />
                              {t('admin.services.list.deleteButton')}
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {t('admin.services.list.noRecords')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile */}
        <div className="divide-y rounded-md border md:hidden">
          {hasData ? (
            pageRows.map((s, i) => {
              const globalIdx = startIndex + i;

              return (
                <div key={s.id} className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-medium">
                      #{globalIdx + 1} {s.name || '—'}
                    </div>
                    <Badge variant={s.is_active ? 'secondary' : 'destructive'}>
                      {s.is_active ? t('admin.services.list.activeStatus') : t('admin.services.list.inactiveStatus')}
                    </Badge>
                    <Badge variant="secondary">{s.featured ? t('admin.services.list.featuredStatus') : t('admin.services.list.normalStatus')}</Badge>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {s.slug ? (
                      <>
                        {t('admin.services.list.slugLabel')} <code className="text-xs">{s.slug}</code>
                      </>
                    ) : (
                      '—'
                    )}
                  </div>

                  <div className="text-sm">
                    <div>{t('admin.services.list.typeLabel')} {formatType(s.type, t)}</div>
                    <div>{t('admin.services.list.priceLabel')} {formatPrice(s.price)}</div>
                    <div className="text-xs text-muted-foreground">
                      {t('admin.services.list.dateLabel')} {formatDate(s.created_at)}
                    </div>
                  </div>

                  {canReorder ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveGlobal(globalIdx, -1)}
                        disabled={loading || globalIdx === 0}
                      >
                        <ArrowUp className="mr-2 size-4" />
                        {t('admin.services.list.upButton')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveGlobal(globalIdx, 1)}
                        disabled={loading || globalIdx === rows.length - 1}
                      >
                        <ArrowDown className="mr-2 size-4" />
                        {t('admin.services.list.downButton')}
                      </Button>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {onEdit ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(s)}
                        disabled={loading}
                      >
                        <Pencil className="mr-2 size-4" />
                        {t('admin.services.list.editButton')}
                      </Button>
                    ) : null}

                    {onDelete ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(s)}
                        disabled={loading}
                        className="border-destructive text-destructive hover:text-destructive"
                      >
                        <Trash2 className="mr-2 size-4" />
                        {t('admin.services.list.deleteButton')}
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">{t('admin.services.list.noRecords')}</div>
          )}
        </div>

        {/* Pagination */}
        {pageCount > 1 ? (
          <div className="flex justify-center py-2">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                  />
                </PaginationItem>

                {buildPages().map((p, i) =>
                  typeof p === 'number' ? (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={p === currentPage}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(p);
                        }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={`e-${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ),
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(pageCount, p + 1));
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
