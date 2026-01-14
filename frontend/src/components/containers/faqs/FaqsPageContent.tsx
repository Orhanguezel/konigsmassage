// =============================================================
// FILE: src/components/containers/faqs/FaqsPageContent.tsx
// Königs Massage – Full FAQs Page Content [FINAL]
// - i18n: useLocaleShort() + ui_faqs (DB) with EN fallback
// - Accordion: theme SCSS (.bd-faq__wrapper-2 + .bd-faq__accordion) (no inline css)
// - No content + not loading => empty message inside accordion
// =============================================================

'use client';

import React, { useMemo, useState, useEffect, useId, useCallback } from 'react';

import { useListFaqsQuery } from '@/integrations/rtk/hooks';
import type { FaqDto } from '@/integrations/types';
import { normalizeFaq } from '@/integrations/types';

// i18n (PATTERN)
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';

function safeStr(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v == null) return '';
  return String(v).trim();
}

const FaqsPageContent: React.FC = () => {
  const uid = useId();
  const locale = useLocaleShort();

  const { ui } = useUiSection('ui_faqs', locale as any);
  const t = useCallback((key: string, fallback: string) => ui(key, fallback), [ui]);

  // UI (DB -> EN fallback)
  const kickerPrefix = safeStr(t('ui_faqs_kicker_prefix', 'Königs Massage'));
  const kickerLabel = safeStr(t('ui_faqs_kicker_label', 'Frequently Asked Questions'));

  const titlePrefix = safeStr(t('ui_faqs_page_title_prefix', 'Common'));
  const titleMark = safeStr(t('ui_faqs_page_title_mark', 'questions'));

  const intro = safeStr(
    t(
      'ui_faqs_intro',
      'Find answers to common questions about Königs Massage sessions, booking, and general practices.',
    ),
  );

  const emptyText = safeStr(t('ui_faqs_empty', 'There are no FAQs to display at the moment.'));
  const untitled = safeStr(t('ui_faqs_untitled', 'Untitled question'));
  const noAnswer = safeStr(
    t('ui_faqs_no_answer', 'No answer has been provided for this question yet.'),
  );
  const footerNote = safeStr(
    t(
      'ui_faqs_footer_note',
      'If you cannot find the answer you are looking for, please contact us.',
    ),
  );

  const { data = [], isLoading } = useListFaqsQuery(
    {
      is_active: 1,
      sort: 'display_order',
      orderDir: 'asc',
      limit: 200,
      locale,
    } as any,
    { skip: !locale },
  );

  const faqs = useMemo(() => {
    const list = (Array.isArray(data) ? data : []) as FaqDto[];

    return list
      .map((dto) => normalizeFaq(dto))
      .filter((f) => !!f && !!f.is_active)
      .sort((a, b) => {
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        const ac = safeStr(a.created_at);
        const bc = safeStr(b.created_at);
        return ac.localeCompare(bc);
      });
  }, [data]);

  const hasFaqs = faqs.length > 0;

  // open state (first item auto-open)
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasFaqs) {
      setOpenId(null);
      return;
    }
    if (openId == null) setOpenId(safeStr(faqs[0]?.id) || null);
  }, [hasFaqs, faqs, openId]);

  return (
    <section className="faq__area pt-120 pb-90 grey-bg-3">
      <div className="container">
        {/* HEADER */}
        <div className="row">
          <div className="col-12">
            <div className="section__title-wrapper text-center mb-50">
              <span className="section__subtitle">
                <span>{kickerPrefix}</span> {kickerLabel}
              </span>

              <h2 className="section__title">
                {titlePrefix} <span className="down__mark-line">{titleMark}</span>
              </h2>

              {intro ? <p className="ens-faqs__intro">{intro}</p> : null}
            </div>
          </div>
        </div>

        {/* ACCORDION */}
        <div className="row" data-aos="fade-up" data-aos-delay="200">
          <div className="col-xl-10 col-lg-11 mx-auto">
            {/* SCSS wrapper */}
            <div className="bd-faq__wrapper-2 mb-10">
              <div className="bd-faq__accordion" data-aos="fade-left" data-aos-duration="1000">
                <div className="accordion" id={`faqAccordion-${uid}`}>
                  {/* EMPTY */}
                  {!isLoading && !hasFaqs ? (
                    <div className="accordion-item">
                      <div className="accordion-body">
                        <p className="text-center mb-0">{emptyText}</p>
                      </div>
                    </div>
                  ) : null}

                  {/* ITEMS */}
                  {faqs.map((faq, idx) => {
                    const id = safeStr(faq.id) || `${uid}-${idx}`;
                    const isOpen = openId === id;

                    const headingId = `faqHeading-${id}`;
                    const panelId = `faqCollapse-${id}`;

                    const q = safeStr(faq.question) || untitled;
                    const a = safeStr(faq.answer);

                    return (
                      <div className="accordion-item" key={id}>
                        <h2 className="accordion-header" id={headingId}>
                          <button
                            type="button"
                            className={`accordion-button${isOpen ? '' : ' collapsed'}`}
                            aria-expanded={isOpen ? 'true' : 'false'}
                            aria-controls={panelId}
                            onClick={() => setOpenId((prev) => (prev === id ? null : id))}
                          >
                            {q}
                          </button>
                        </h2>

                        {/* Bootstrap JS yok: class ile show/hide */}
                        <div
                          id={panelId}
                          className={`accordion-collapse collapse${isOpen ? ' show' : ''}`}
                          aria-labelledby={headingId}
                        >
                          <div className="accordion-body">
                            {a ? (
                              <div dangerouslySetInnerHTML={{ __html: a }} />
                            ) : (
                              <p className="text-muted small mb-0">{noAnswer}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* LOADING */}
                  {isLoading ? (
                    <div className="accordion-item" aria-hidden>
                      <div className="accordion-body">
                        <div className="skeleton-line ens-faqs__skelLine" />
                        <div className="skeleton-line ens-faqs__skelLine ens-faqs__skelLine--w80" />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* FOOTER NOTE */}
            {footerNote ? (
              <div className="text-center mt-20">
                <p className="small text-muted mb-0">{footerNote}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqsPageContent;
