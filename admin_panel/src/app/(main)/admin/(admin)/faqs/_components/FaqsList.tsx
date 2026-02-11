'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/faqs/_components/FaqsList.tsx
// FINAL — FAQ list (Table >=1700px, Cards mobile)
// - ✅ Types: FaqDto
// - ✅ Delete: useDeleteFaqAdminMutation
// - ✅ Optional reorder controls (up/down + save)
// =============================================================

import React, { useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { ArrowUp, ArrowDown, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

import type { FaqDto } from '@/integrations/shared';
import { useDeleteFaqAdminMutation } from '@/integrations/hooks';

export type FaqsListProps = {
  items?: FaqDto[];
  loading: boolean;

  onSaveOrder?: () => void;
  savingOrder?: boolean;

  enableMoveControls?: boolean;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;

  activeLocale?: string;
};

const VERY_LARGE_BP = 1700;

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const normLocale = (v: unknown): string =>
  String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

const safeText = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const isActive = (v: any) => !!Number(v ?? 0);

export const FaqsList: React.FC<FaqsListProps> = ({
  items,
  loading,
  onSaveOrder,
  savingOrder,
  enableMoveControls,
  onMoveUp,
  onMoveDown,
  activeLocale,
}) => {
  const rows = items ?? [];
  const hasData = rows.length > 0;

  const [deleteFaq, { isLoading: isDeleting }] = useDeleteFaqAdminMutation();
  const busy = loading || isDeleting || !!savingOrder;

  const effectiveLocale = useMemo(() => normLocale(activeLocale) || '', [activeLocale]);

  const editHrefById = (id: string) => ({
    pathname: `/admin/faqs/${encodeURIComponent(id)}`,
    query: effectiveLocale ? { locale: effectiveLocale } : undefined,
  });

  const renderStatus = (p: FaqDto) =>
    isActive(p.is_active) ? (
      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]">
        Aktif
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
        Pasif
      </span>
    );

  const handleDelete = async (faq: FaqDto) => {
    const ok = window.confirm(
      `Bu FAQ kaydını silmek üzeresin.\n\n` +
        `Question: ${faq.question ?? '(yok)'}\n` +
        `ID: ${faq.id}\n` +
        `Slug: ${faq.slug ?? '(yok)'}\n\n` +
        `Devam etmek istiyor musun?`,
    );
    if (!ok) return;

    try {
      await deleteFaq(faq.id).unwrap();
      toast.success('FAQ başarıyla silindi.');
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: { message?: string } } })?.data?.error?.message ??
        'FAQ silinirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  const renderEmptyOrLoading = () => {
    if (loading) return <div className="p-6 text-sm text-muted-foreground">FAQ yükleniyor...</div>;
    return <div className="p-6 text-sm text-muted-foreground">Henüz kayıtlı FAQ yok.</div>;
  };

  const MoveControls = ({ idx }: { idx: number }) => {
    if (!enableMoveControls) return null;
    return (
      <div className="inline-flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMoveUp?.(idx)}
          disabled={busy || idx === 0 || !onMoveUp}
          title="Yukarı"
        >
          <ArrowUp className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMoveDown?.(idx)}
          disabled={busy || idx === rows.length - 1 || !onMoveDown}
          title="Aşağı"
        >
          <ArrowDown className="size-4" />
        </Button>
      </div>
    );
  };

  const renderCards = () => {
    if (!hasData) return renderEmptyOrLoading();

    return (
      <div className="p-4">
        <div className="grid gap-3 2xl:grid-cols-2">
          {rows.map((p, idx) => {
            const localeResolved = safeText((p as any).locale_resolved);

            return (
              <div key={p.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                        #{idx + 1}
                      </span>
                      {renderStatus(p)}
                      {localeResolved ? (
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                          Locale: <code className="ml-1">{localeResolved}</code>
                        </span>
                      ) : null}
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                        Order: <code className="ml-1">{String(p.display_order ?? 0)}</code>
                      </span>
                    </div>

                    <div
                      className="mt-2 truncate text-sm font-semibold"
                      title={safeText(p.question)}
                    >
                      {p.question ?? <span className="text-muted-foreground">Question yok</span>}
                    </div>

                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      Slug: <code>{p.slug ?? '-'}</code>
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      <div>Oluşturulma: {formatDate(p.created_at)}</div>
                      <div>Güncelleme: {formatDate(p.updated_at)}</div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 items-end">
                    <MoveControls idx={idx} />
                    <Link
                      href={editHrefById(p.id)}
                      className="rounded-md border px-3 py-1 text-xs text-center"
                    >
                      Düzenle
                    </Link>
                    <button
                      type="button"
                      className="rounded-md border px-3 py-1 text-xs text-center text-destructive disabled:opacity-60"
                      disabled={busy}
                      onClick={() => handleDelete(p)}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          Varsayılan görünüm karttır. Çok büyük ekranlarda (≥ {VERY_LARGE_BP}px) tablo görünümü
          açılır.
        </div>
      </div>
    );
  };

  const renderTable = () => {
    if (!hasData) return renderEmptyOrLoading();

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-left">
              <th className="px-3 py-2 text-xs text-muted-foreground">#</th>
              <th className="px-3 py-2 text-xs">Question</th>
              <th className="px-3 py-2 text-xs">Slug</th>
              <th className="px-3 py-2 text-xs">Order</th>
              <th className="px-3 py-2 text-xs">Durum</th>
              <th className="px-3 py-2 text-xs">Tarih</th>
              <th className="px-3 py-2 text-xs text-right">İşlemler</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((p, idx) => {
              const localeResolved = safeText((p as any).locale_resolved);

              return (
                <tr key={p.id} className="border-b">
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {idx + 1}
                  </td>

                  <td className="px-3 py-2 min-w-0">
                    <div className="min-w-0">
                      <div className="truncate font-semibold" title={safeText(p.question)}>
                        {p.question ?? 'Question yok'}
                      </div>
                      {localeResolved ? (
                        <div className="truncate text-xs text-muted-foreground">
                          Locale: <code>{localeResolved}</code>
                        </div>
                      ) : null}
                    </div>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <code className="text-xs">{p.slug ?? '-'}</code>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <code className="text-xs">{String(p.display_order ?? 0)}</code>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">{renderStatus(p)}</td>

                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    <div>{formatDate(p.created_at)}</div>
                    <div className="text-muted-foreground">
                      Güncelleme: {formatDate(p.updated_at)}
                    </div>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-2">
                      <MoveControls idx={idx} />
                      <Link
                        href={editHrefById(p.id)}
                        className="rounded-md border px-3 py-1 text-xs"
                      >
                        Düzenle
                      </Link>
                      <button
                        type="button"
                        className="rounded-md border px-3 py-1 text-xs text-destructive disabled:opacity-60"
                        disabled={busy}
                        onClick={() => handleDelete(p)}
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="p-3 text-xs text-muted-foreground">
          Sıralama: Yukarı/Aşağı ile taşı, sonra kaydet.
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">Liste</div>
            <div className="text-xs text-muted-foreground">
              {busy ? 'Yükleniyor…' : `${rows.length} kayıt`}
            </div>
          </div>

          {onSaveOrder ? (
            <Button variant="outline" onClick={onSaveOrder} disabled={busy || !hasData}>
              <Save className="mr-2 size-4" />
              {savingOrder ? 'Kaydediliyor…' : 'Sıralamayı Kaydet'}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="hidden min-[1700px]:block">{renderTable()}</div>
      <div className="block min-[1700px]:hidden">{renderCards()}</div>
    </div>
  );
};
