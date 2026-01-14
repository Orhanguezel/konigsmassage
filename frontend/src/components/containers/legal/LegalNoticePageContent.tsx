// =============================================================
// FILE: src/components/containers/legal/LegalNoticePageContent.tsx
// konigsmassage – Legal Notice Content (SINGLE PAGE) (I18N + SAFE)
// Data: custom_pages (module_key="legal_notice") -> first published
// - Locale aware query
// - DB content supports: content_html OR content(JSON {html}) OR JSON-string OR raw HTML
// - H1 forbidden: CMS html <h1> -> <h2>
// - Minimal CSS fallbacks for Tailwind-like classes used in seeds (purge/JIT)
// =============================================================

'use client';

import React, { useMemo } from 'react';

import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import type { CustomPageDto } from '@/integrations/types';

import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';

const downgradeH1ToH2 = (rawHtml: string) =>
  String(rawHtml || '')
    .replace(/<h1(\s|>)/gi, '<h2$1')
    .replace(/<\/h1>/gi, '</h2>');

function safeJson<T>(v: any, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v === 'object') return v as T;
  if (typeof v !== 'string') return fallback;
  const s = v.trim();
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function extractHtmlFromPage(page: any): string {
  if (!page) return '';

  const ch = String(page?.content_html ?? '').trim();
  if (ch) return ch;

  const c = page?.content ?? page?.content_json ?? page?.contentJson;
  if (!c) return '';

  if (typeof c === 'object') {
    const html = (c as any)?.html;
    return typeof html === 'string' ? html.trim() : '';
  }

  if (typeof c === 'string') {
    const s = c.trim();
    if (!s) return '';
    if (s.startsWith('{') || s.startsWith('[')) {
      const obj = safeJson<any>(s, null);
      const html = obj?.html;
      if (typeof html === 'string' && html.trim()) return html.trim();
    }
    return s;
  }

  return '';
}

function pickFirstPublished(items: any): CustomPageDto | null {
  const arr: CustomPageDto[] = Array.isArray(items) ? (items as any) : [];
  const published = arr.filter((p) => !!p?.is_published);
  return published[0] ?? null;
}

const LegalNoticePageContent: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_legal_notice', locale as any);

  const { data, isLoading, isError } = useListCustomPagesPublicQuery({
    module_key: 'legal_notice',
    locale,
    limit: 10,
    sort: 'created_at',
    orderDir: 'asc',
  });

  const page = useMemo(() => pickFirstPublished((data as any)?.items), [data]);

  const title = useMemo(() => {
    const t = String((page as any)?.title ?? '').trim();
    return (
      t ||
      String(ui('ui_legal_notice_fallback_title', 'Yasal Bilgilendirme') || '').trim() ||
      'Yasal Bilgilendirme'
    );
  }, [page, ui]);

  const html = useMemo(() => {
    const raw = extractHtmlFromPage(page);
    const safe = raw ? downgradeH1ToH2(raw) : '';
    return safe;
  }, [page]);

  const cmsFallbackCss = useMemo(
    () => `
      .cms-html { color: #0f172a; }
      .cms-html h1 { font-size: 1.875rem; line-height: 2.25rem; font-weight: 800; margin: 0 0 .75rem; color: #0f172a; }
      .cms-html h2 { font-size: 1.5rem; line-height: 2rem; font-weight: 800; margin: 0 0 .75rem; color: #0f172a; }
      .cms-html h3 { font-size: 1.125rem; line-height: 1.75rem; font-weight: 800; margin: 0 0 .5rem; color: #0f172a; }
      .cms-html p { margin: 0 0 1rem; color: #334155; line-height: 1.75; }
      .cms-html ul { margin: .5rem 0 1rem; padding-left: 1.25rem; color: #334155; }
      .cms-html li { margin: .25rem 0; }

      .cms-html .container { max-width: 72rem; margin-left: auto; margin-right: auto; }
      .cms-html .mx-auto { margin-left: auto; margin-right: auto; }
      .cms-html .px-4 { padding-left: 1rem; padding-right: 1rem; }
      .cms-html .py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; }

      .cms-html .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
      .cms-html .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
      .cms-html .md\\:text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
      .cms-html .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
      .cms-html .font-semibold { font-weight: 600; }

      .cms-html .text-slate-900 { color: #0f172a !important; }
      .cms-html .text-slate-700 { color: #334155 !important; }
      .cms-html .text-white { color: #ffffff !important; }
      .cms-html .text-white\\/90 { color: rgba(255,255,255,.9) !important; }

      .cms-html .mb-3 { margin-bottom: .75rem !important; }
      .cms-html .mb-4 { margin-bottom: 1rem !important; }
      .cms-html .mb-6 { margin-bottom: 1.5rem !important; }
      .cms-html .mb-8 { margin-bottom: 2rem !important; }

      .cms-html .bg-white { background: #ffffff !important; }
      .cms-html .bg-slate-900 { background: #0f172a !important; }

      .cms-html .border { border-width: 1px; border-style: solid; }
      .cms-html .border-slate-200 { border-color: #e2e8f0 !important; }

      .cms-html .rounded-2xl { border-radius: 1rem !important; }
      .cms-html .p-6 { padding: 1.5rem !important; }

      .cms-html .grid { display: grid !important; }
      .cms-html .gap-6 { gap: 1.5rem !important; }
      .cms-html .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }

      .cms-html .list-disc { list-style-type: disc !important; }
      .cms-html .pl-6 { padding-left: 1.5rem !important; }
      .cms-html .space-y-2 > * + * { margin-top: .5rem !important; }
    `,
    [],
  );

  return (
    <section className="about__area grey-bg z-index-11 p-relative pt-80 pb-60">
      <div className="container">
        {isLoading && (
          <div className="row mb-40">
            <div className="col-12">
              <div className="skeleton-line" style={{ height: 12 }} aria-hidden />
            </div>
          </div>
        )}

        {!isLoading && (isError || !page) && (
          <div className="row">
            <div className="col-12">
              <div className="alert alert-warning">
                {ui('ui_legal_notice_empty', 'Legal notice content not found.')}
              </div>
            </div>
          </div>
        )}

        {!!page && !isLoading && (
          <div className="row">
            <div className="col-12">
              <style>{cmsFallbackCss}</style>

              {html ? (
                <div className="cms-html" dangerouslySetInnerHTML={{ __html: html }} />
              ) : (
                <div className="alert alert-warning">
                  {ui(
                    'ui_legal_notice_empty_text',
                    'Yasal bilgilendirme içeriği yakında yayınlanacaktır.',
                  )}
                </div>
              )}

              <span className="d-none" aria-hidden>
                {title}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default LegalNoticePageContent;
