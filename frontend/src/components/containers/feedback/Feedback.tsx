'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useListReviewsPublicQuery } from '@/integrations/rtk/hooks';
import type { ReviewDto } from '@/integrations/shared';
import { safeStr,excerpt, clampRating } from '@/integrations/shared';


import { useResolvedLocale, useUiSection } from '@/i18n';

import { IconChevronLeft, IconChevronRight } from '@/components/ui/icons';
import StarRating from './StarRating';
import FeedbackFormModal from './FeedbackFormModal';

type FeedbackSlide = {
  id: string;
  name: string;
  text: string;
  rating: number;
};

const TARGET_TYPE = 'testimonial';
const TARGET_ID = 'konigsmassage';

const Feedback: React.FC<{ locale?: string }> = ({ locale: explicitLocale }) => {
  const locale = useResolvedLocale(explicitLocale);
  const { ui } = useUiSection('ui_feedback', locale);

  const { data, isLoading } = useListReviewsPublicQuery({
    minRating: 1,
    limit: 12,
    orderBy: 'display_order',
    order: 'asc',
    locale,
    approved: 1,
    active: 1,
    target_type: TARGET_TYPE,
    target_id: TARGET_ID,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const slides: FeedbackSlide[] = useMemo(() => {
    const list: ReviewDto[] = Array.isArray(data) ? data : [];
    return list.map((r) => ({
      id: String(r.id),
      name: safeStr(r.name),
      text: excerpt(safeStr(r.comment), 280),
      rating: clampRating(Number(r.rating || 5)) | 0,
    }));
  }, [data]);

  const t = useMemo(
    () => ({
      subprefix: safeStr(ui('ui_feedback_subprefix')),
      sublabel: safeStr(ui('ui_feedback_sublabel')),
      title: safeStr(ui('ui_feedback_title')),
      paragraph: safeStr(ui('ui_feedback_paragraph')),
      prev: safeStr(ui('ui_feedback_prev')) || 'Previous',
      next: safeStr(ui('ui_feedback_next')) || 'Next',
      writeBtn: safeStr(ui('ui_feedback_write_button')),
      modalTitle: safeStr(ui('ui_feedback_modal_title')),
      close: safeStr(ui('ui_common_close')) || 'Close',
      submit: safeStr(ui('ui_feedback_submit')) || 'Submit',
      sending: safeStr(ui('ui_feedback_sending')) || 'Sending...',
      fName: safeStr(ui('ui_feedback_field_name')) || 'Name',
      fEmail: safeStr(ui('ui_feedback_field_email')) || 'Email',
      fRating: safeStr(ui('ui_feedback_field_rating')) || 'Rating',
      fComment: safeStr(ui('ui_feedback_field_comment')) || 'Comment',
      errName: safeStr(ui('ui_feedback_error_name')) || 'Name required',
      errEmail: safeStr(ui('ui_feedback_error_email')) || 'Invalid email',
      errComment: safeStr(ui('ui_feedback_error_comment')) || 'Comment required',
      errGeneric: safeStr(ui('ui_feedback_error_generic')) || 'Error occurred',
      okMsg: safeStr(ui('ui_feedback_success')) || 'Review submitted successfully!',
    }),
    [ui],
  );

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  // Auto-rotate slider
  useEffect(() => {
    if (isModalOpen || isLoading || slides.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIdx((p) => (p + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [isModalOpen, isLoading, slides.length]);

  if (!isLoading && slides.length === 0) return null;

  const effectiveIdx = slides.length
    ? ((activeIdx % slides.length) + slides.length) % slides.length
    : 0;
  const active = slides[effectiveIdx];

  return (
    <section className="bg-bg-primary py-20 lg:py-32 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-sand-50/50 -skew-x-12 translate-x-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Sol: Başlık + kontroller */}
          <div data-aos="fade-right" className="flex flex-col items-start">
            <div className="mb-8">
              <span className="inline-block py-1 px-3 rounded-full bg-sand-100 text-brand-dark text-xs font-bold uppercase tracking-widest mb-4">
                {t.subprefix} {t.sublabel}
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-text-primary leading-[1.1] mb-6">
                {t.title}
              </h2>
              <p className="text-lg text-text-secondary leading-relaxed max-w-xl">{t.paragraph}</p>
            </div>

            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex gap-3">
                <button
                  className="w-12 h-12 flex items-center justify-center rounded-full border border-sand-300 text-text-primary hover:bg-brand-primary hover:border-brand-primary hover:text-white transition-all duration-300"
                  aria-label={t.prev}
                  type="button"
                  onClick={() =>
                    setActiveIdx((p) => (p - 1 + (slides.length || 1)) % (slides.length || 1))
                  }
                  disabled={isLoading || slides.length <= 1}
                >
                  <IconChevronLeft size={22} />
                </button>
                <button
                  className="w-12 h-12 flex items-center justify-center rounded-full border border-sand-300 text-text-primary hover:bg-brand-primary hover:border-brand-primary hover:text-white transition-all duration-300"
                  aria-label={t.next}
                  type="button"
                  onClick={() => setActiveIdx((p) => (p + 1) % (slides.length || 1))}
                  disabled={isLoading || slides.length <= 1}
                >
                  <IconChevronRight size={22} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center px-8 py-3 bg-brand-primary text-white font-medium uppercase tracking-wider hover:bg-brand-dark transition-all duration-300 rounded-sm shadow-sm hover:shadow-md"
              >
                {t.writeBtn}
              </button>
            </div>
          </div>

          {/* Sağ: Slider */}
          <div className="w-full" data-aos="fade-left">
            <div className="relative">
              {isLoading ? (
                <div className="w-full bg-sand-50 rounded-2xl p-10 h-80 animate-pulse" />
              ) : (
                <div className="bg-sand-50 p-8 md:p-12 rounded-2xl border border-sand-200 shadow-sm relative">
                  <div className="text-sand-300/30 absolute top-6 right-8 text-9xl font-serif leading-none select-none pointer-events-none">
                    &ldquo;
                  </div>

                  <div className="mb-6">
                    {active && <StarRating rating={active.rating} />}
                  </div>

                  <p className="text-xl text-text-secondary font-medium italic leading-relaxed mb-8 relative z-10">
                    {active ? `\u201C${active.text}\u201D` : ''}
                  </p>

                  <p className="text-text-primary font-bold text-lg">{active?.name || ''}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && <FeedbackFormModal locale={locale} t={t} onClose={closeModal} />}
    </section>
  );
};

export default Feedback;
