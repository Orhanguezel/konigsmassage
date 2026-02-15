'use client';

import React, { useMemo } from 'react';
import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import type { CustomPageDto } from '@/integrations/shared';
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

const THEME_COLORS = {
  textDark: '#292524',
  textMedium: '#57534e',
  primary: '#881337',
  bgWhite: '#ffffff',
  bgSand: '#fafaf9',
  border: '#e7e5e4',
};

const PrivacyPolicyPageContent: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_privacy_policy', locale as any);

  const { data, isLoading, isError } = useListCustomPagesPublicQuery({
    module_key: 'privacy',
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
      String(ui('ui_privacy_policy_fallback_title', 'Privacy Policy') || '').trim() ||
      'Privacy Policy'
    );
  }, [page, ui]);

  const html = useMemo(() => {
    const raw = extractHtmlFromPage(page);
    const safe = raw ? downgradeH1ToH2(raw) : '';
    return safe;
  }, [page]);

  const cmsFallbackCss = useMemo(
    () => `
      .cms-html { color: ${THEME_COLORS.textMedium}; font-family: sans-serif; }
      
      .cms-html h1, .cms-html h2, .cms-html h3, .cms-html h4 {
        color: ${THEME_COLORS.primary};
        font-family: serif;
        font-weight: 700;
      }
      .cms-html h1 { font-size: 2.25rem; line-height: 2.5rem; margin: 0 0 1rem; }
      .cms-html h2 { font-size: 1.875rem; line-height: 2.25rem; margin: 2rem 0 1rem; }
      .cms-html h3 { font-size: 1.5rem; line-height: 2rem; margin: 1.5rem 0 0.75rem; }
      .cms-html h4 { font-size: 1.25rem; line-height: 1.75rem; margin: 1.5rem 0 0.5rem; }

      .cms-html p { margin: 0 0 1rem; line-height: 1.8; color: ${THEME_COLORS.textMedium}; }
      .cms-html strong { color: ${THEME_COLORS.textDark}; font-weight: 700; }
      
      .cms-html ul { margin: 1rem 0; padding-left: 1.5rem; list-style-type: disc; }
      .cms-html ol { margin: 1rem 0; padding-left: 1.5rem; list-style-type: decimal; }
      .cms-html li { margin: 0.5rem 0; color: ${THEME_COLORS.textMedium}; }

      .cms-html .container { max-width: 100%; }
      .cms-html .text-3xl { font-size: 1.875rem; }
      .cms-html .text-xl { font-size: 1.25rem; }
      .cms-html .font-semibold { font-weight: 600; }
      
      .cms-html .text-slate-900 { color: ${THEME_COLORS.textDark} !important; }
      .cms-html .text-slate-700 { color: ${THEME_COLORS.textMedium} !important; }
      
      .cms-html .bg-white { background: ${THEME_COLORS.bgWhite} !important; }
      .cms-html .bg-gray-50 { background: ${THEME_COLORS.bgSand} !important; }
      
      .cms-html .border { border: 1px solid ${THEME_COLORS.border}; }
      
      .cms-html a { color: ${THEME_COLORS.primary}; text-decoration: underline; }
      .cms-html a:hover { color: ${THEME_COLORS.textDark}; }
    `,
    [],
  );

  return (
    <section className="bg-bg-primary relative min-h-[60vh] py-20 lg:py-32">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-sand-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
        <div className="absolute top-40 -left-20 w-72 h-72 bg-rose-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {isLoading && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="h-4 bg-sand-200 rounded w-full animate-pulse" />
            <div className="h-4 bg-sand-200 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-sand-200 rounded w-4/6 animate-pulse" />
          </div>
        )}

        {!isLoading && (isError || !page) && (
          <div className="max-w-4xl mx-auto">
            <div
              className="bg-sand-50 border border-sand-200 text-brand-dark px-6 py-4 rounded-xl"
              role="alert"
            >
              {ui('ui_privacy_policy_empty', 'Content not found.')}
            </div>
          </div>
        )}

        {!!page && !isLoading && (
          <div className="max-w-4xl mx-auto">
            <style>{cmsFallbackCss}</style>

            <div className="mb-12 text-center">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark mb-4">
                {title}
              </h1>
              <div className="h-1 w-24 bg-brand-primary mx-auto rounded-full" />
            </div>

            {html ? (
              <article
                className="prose prose-stone prose-lg max-w-none bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-sand-200 cms-html"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <div
                className="bg-sand-50 border border-sand-200 text-brand-dark px-6 py-4 rounded-xl"
                role="alert"
              >
                {ui('ui_privacy_policy_empty_text', 'Content coming soon.')}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default PrivacyPolicyPageContent;
