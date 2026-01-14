// =============================================================
// FILE: src/components/common/AdminImageUploadField.tsx
// konigsmassage – Admin Image Upload Field (FINAL)
// - Multiple preview: one image per row (no side-by-side confusion)
// - Cover cannot be removed
// - No duplicate toast on cover selection (caller handles toast)
// - URL never overflows: truncated display + full on hover + full copy
// - previewAspect + previewObjectFit (single preview configurable)
// - SVG preview support (incl. Cloudinary .svg) + ICO destekli
// - FIX:
//   * Cloudinary raw/upload + uzantısız favicon artık SVG sayılmaz
//   * raw/upload için fl_sanitize enjekte ETME (zaten transform yok)
// =============================================================

'use client';

import React, { useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useCreateAssetAdminMutation } from '@/integrations/rtk/hooks';

export type AdminImageUploadFieldProps = {
  label?: string;
  helperText?: React.ReactNode;

  bucket?: string;
  folder?: string;
  metadata?: Record<string, string | number | boolean>;

  value?: string;
  onChange?: (url: string) => void;

  values?: string[];
  onChangeMultiple?: (urls: string[]) => void;

  onSelectAsCover?: (url: string) => void;
  coverValue?: string;

  disabled?: boolean;

  openLibraryHref?: string;
  onOpenLibraryClick?: () => void;

  multiple?: boolean;

  /** Tekli preview için aspect oranı (Bootstrap ratio class) */
  previewAspect?: '16x9' | '4x3' | '1x1';
  /** Tekli preview için object-fit davranışı */
  previewObjectFit?: 'cover' | 'contain';
};

const norm = (v: unknown) => String(v ?? '').trim();

/* ---------------- SVG / Cloudinary helpers ---------------- */

const isSvgUrl = (raw: string | undefined | null): boolean => {
  const s = norm(raw);
  if (!s) return false;

  const lower = s.toLowerCase();
  const base = lower.split('?')[0].split('#')[0];

  // Klasik SVG sinyalleri
  if (base.endsWith('.svg')) return true;
  if (lower.startsWith('data:image/svg+xml')) return true;
  if (lower.includes('format=svg') || lower.includes('f_svg')) return true;

  // raw/upload + uzantısız (favicon gibi) ARTIK svg sayılmıyor
  return false;
};

/**
 * Cloudinary SVG önizlemede bazen sanitize gerekir:
 * - sadece preview'de kullanılır, DB'ye yazılmaz
 * - raw/upload için transform DENENMEZ (aynı URL döner)
 */
const withCloudinarySanitizeIfSvg = (raw: string): string => {
  const s = norm(raw);
  if (!s) return '';
  if (!isSvgUrl(s)) return s;

  if (s.startsWith('data:image/svg+xml')) return s;
  if (!s.includes('res.cloudinary.com')) return s;

  // raw/upload ise hiç dokunma, olduğu gibi kullan
  if (s.includes('/raw/upload/')) return s;

  if (s.includes('fl_sanitize')) return s;

  const marker = '/upload/';
  const idx = s.indexOf(marker);
  if (idx < 0) return s;

  const before = s.slice(0, idx + marker.length);
  const after = s.slice(idx + marker.length);

  const firstSeg = after.split('/')[0] || '';
  const rest = after.slice(firstSeg.length);

  // versiyon segmenti (v123...) varsa sonrasına ekle
  if (firstSeg.startsWith('v')) {
    return `${before}fl_sanitize/${after}`;
  }

  // aksi halde ilk segmente ekle
  return `${before}${firstSeg},fl_sanitize${rest}`;
};

const toMeta = (metadata?: Record<string, string | number | boolean>) => {
  if (!metadata) return undefined;
  return Object.fromEntries(Object.entries(metadata).map(([k, v]) => [k, String(v)]));
};

const uniqAppend = (arr: string[], items: string[]) => {
  const set = new Set(arr.map((x) => norm(x)));
  const out = [...arr];

  for (const it of items) {
    const v = norm(it);
    if (v && !set.has(v)) {
      set.add(v);
      out.push(v);
    }
  }
  return out;
};

// URL’yi ekranda kısa göster: host + son parça (ve query’yi kes)
const displayUrl = (raw: string, max = 72) => {
  const s = norm(raw);
  if (!s) return '';
  if (s.length <= max) return s;

  // try parse
  try {
    const u = new URL(s);
    const host = u.host;
    const path = u.pathname || '';
    const last = path.split('/').filter(Boolean).pop() || '';
    const short = `${host}/…/${last}`;
    if (short.length <= max) return short;
  } catch {
    // ignore
  }

  // fallback: head..tail
  const head = s.slice(0, Math.max(18, Math.floor(max * 0.55)));
  const tail = s.slice(-Math.max(12, Math.floor(max * 0.25)));
  return `${head}…${tail}`;
};

const UrlLine: React.FC<{ url: string; disabled?: boolean }> = ({ url, disabled }) => {
  const safe = norm(url);
  if (!safe) return null;

  const shown = displayUrl(safe, 80);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(safe);
      toast.success('URL kopyalandı.');
    } catch {
      toast.error('Kopyalanamadı.');
    }
  };

  return (
    <div
      className="d-flex align-items-center gap-2 mt-2"
      style={{
        minWidth: 0,
      }}
    >
      <div
        className="flex-grow-1"
        style={{
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <div
          className="text-muted small text-truncate"
          title={safe}
          style={{
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {shown}
        </div>
      </div>

      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={copy}
        disabled={disabled}
        title="Kopyala"
        style={{ flex: '0 0 auto' }}
      >
        Kopyala
      </button>
    </div>
  );
};

export const AdminImageUploadField: React.FC<AdminImageUploadFieldProps> = ({
  label = 'Görsel',
  helperText,
  bucket = 'public',
  folder = 'uploads',
  metadata,

  value,
  onChange,

  values,
  onChangeMultiple,
  onSelectAsCover,
  coverValue,

  disabled,
  openLibraryHref,
  onOpenLibraryClick,
  multiple = false,

  previewAspect = '16x9',
  previewObjectFit = 'cover',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [createAssetAdmin, { isLoading: isUploading }] = useCreateAssetAdminMutation();

  const meta = useMemo(() => toMeta(metadata), [metadata]);
  const gallery = useMemo(
    () => (Array.isArray(values) ? values.map(norm).filter(Boolean) : []),
    [values],
  );

  const handlePickClick = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;

    // SINGLE
    if (!multiple) {
      const file = files[0];
      try {
        const res = await createAssetAdmin({
          file,
          bucket,
          folder,
          metadata: meta,
        } as any).unwrap();

        const url = norm((res as any)?.url);
        if (!url) throw new Error("Görsel URL'i alınamadı.");

        onChange?.(url);
        toast.success('Görsel yüklendi.');
      } catch (err: any) {
        const msg = err?.data?.error?.message || err?.message || 'Görsel yüklenirken hata oluştu.';
        toast.error(msg);
      }
      return;
    }

    // MULTIPLE
    const uploadedUrls: string[] = [];
    let successCount = 0;

    for (const file of files) {
      try {
        const res = await createAssetAdmin({
          file,
          bucket,
          folder,
          metadata: meta,
        } as any).unwrap();

        const url = norm((res as any)?.url);
        if (url) {
          uploadedUrls.push(url);
          successCount += 1;
        }
      } catch (err: any) {
        const msg =
          err?.data?.error?.message || err?.message || 'Bazı görseller yüklenirken hata oluştu.';
        toast.error(msg);
      }
    }

    if (successCount > 0) {
      if (onChangeMultiple) {
        const next = uniqAppend(gallery, uploadedUrls);
        onChangeMultiple(next);
      } else {
        onChange?.(uploadedUrls[0]);
      }
      toast.success(successCount === 1 ? 'Görsel yüklendi.' : `${successCount} görsel yüklendi.`);
    }
  };

  const handleOpenLibrary = (e: React.MouseEvent) => {
    if (onOpenLibraryClick) {
      e.preventDefault();
      onOpenLibraryClick();
      return;
    }
  };

  const removeAt = (idx: number) => {
    if (!onChangeMultiple) return;

    const url = gallery[idx];
    const isCover = !!coverValue && norm(coverValue) === url;

    if (isCover) {
      toast.error('Kapak görseli silinemez. Önce başka bir kapak seç.');
      return;
    }

    onChangeMultiple(gallery.filter((_, i) => i !== idx));
  };

  const isMulti = !!multiple;

  const aspectClass =
    previewAspect === '4x3' ? 'ratio-4x3' : previewAspect === '1x1' ? 'ratio-1x1' : 'ratio-16x9';

  /* ---------------- SINGLE PREVIEW ---------------- */

  const renderSinglePreview = () => {
    if (!value) {
      return (
        <div className="border rounded-2 p-3 bg-light text-center text-muted small">
          Henüz görsel seçilmedi.
        </div>
      );
    }

    const svg = isSvgUrl(value);
    const previewUrl = svg ? withCloudinarySanitizeIfSvg(value) : value;

    return (
      <div className="border rounded-2 p-2 bg-light">
        <div className="small text-muted mb-1">Önizleme</div>

        <div className={`ratio ${aspectClass} bg-white border rounded overflow-hidden`}>
          {svg ? (
            <object
              data={previewUrl}
              type="image/svg+xml"
              className="w-100 h-100"
              aria-label="SVG preview"
            >
              <div className="w-100 h-100 d-flex align-items-center justify-content-center small text-muted">
                SVG önizleme açılamadı.
              </div>
            </object>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Görsel"
              className="w-100 h-100"
              style={{ objectFit: previewObjectFit }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </div>

        <UrlLine url={value} disabled={disabled} />
      </div>
    );
  };

  /* ---------------- MULTI PREVIEW ---------------- */

  const renderMultiPreview = () => {
    if (!gallery.length) {
      return (
        <div className="border rounded-2 p-3 bg-light text-center text-muted small">
          Henüz galeri görseli yok.
        </div>
      );
    }

    return (
      <div>
        <div className="small text-muted mb-2">Galeri</div>

        <div className="d-flex flex-column gap-2">
          {gallery.map((u, idx) => {
            const isCover = !!coverValue && norm(coverValue) === u;
            const svg = isSvgUrl(u);
            const previewUrl = svg ? withCloudinarySanitizeIfSvg(u) : u;

            return (
              <div
                key={`${u}-${idx}`}
                className={`border rounded-2 p-2 ${isCover ? 'border-primary' : ''}`}
              >
                <div className="d-flex gap-2" style={{ minWidth: 0 }}>
                  {/* thumb */}
                  <div style={{ width: 140, flex: '0 0 auto' }}>
                    <div className="ratio ratio-16x9 bg-white border rounded overflow-hidden">
                      {svg ? (
                        <object
                          data={previewUrl}
                          type="image/svg+xml"
                          className="w-100 h-100"
                          aria-label={`SVG image ${idx + 1}`}
                        >
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center small text-muted">
                            SVG yüklenemedi.
                          </div>
                        </object>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
                          alt={`image-${idx + 1}`}
                          className="w-100 h-100"
                          style={{ objectFit: 'cover' }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* actions */}
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <div
                        className="small fw-semibold text-truncate"
                        title={u}
                        style={{ minWidth: 0 }}
                      >
                        {isCover ? 'Kapak' : `Görsel ${idx + 1}`}
                      </div>

                      <div className="d-flex gap-1" style={{ flex: '0 0 auto' }}>
                        {onSelectAsCover && (
                          <button
                            type="button"
                            className={`btn btn-sm ${
                              isCover ? 'btn-primary' : 'btn-outline-primary'
                            }`}
                            disabled={disabled || isUploading}
                            onClick={() => onSelectAsCover(u)}
                            title="Kapak yap"
                          >
                            Kapak
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          disabled={disabled || isUploading || !onChangeMultiple || isCover}
                          onClick={() => removeAt(idx)}
                          title={isCover ? 'Kapak silinemez' : 'Sil'}
                        >
                          Sil
                        </button>
                      </div>
                    </div>

                    <UrlLine url={u} disabled={disabled || isUploading} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!onChangeMultiple && (
          <div className="form-text small mt-2">
            Not: <code>onChangeMultiple</code> verilmediği için galeri listesi parent tarafından
            yönetilmiyor.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-2 p-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="small fw-semibold">{label}</span>
        {isUploading && <span className="badge bg-secondary small">Yükleniyor...</span>}
      </div>

      {helperText && <div className="text-muted small mb-2">{helperText}</div>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={isMulti}
        className="d-none"
        onChange={handleFileChange}
      />

      <div className="mb-2">
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={handlePickClick}
          disabled={disabled || isUploading}
        >
          {isMulti ? 'Görseller Yükle' : 'Görsel Yükle'}
        </button>

        {openLibraryHref || onOpenLibraryClick ? (
          <a
            href={openLibraryHref || '#'}
            className="btn btn-link btn-sm ms-2 px-1"
            onClick={handleOpenLibrary}
          >
            Kütüphaneyi aç
          </a>
        ) : null}
      </div>

      {!isMulti ? renderSinglePreview() : renderMultiPreview()}
    </div>
  );
};
