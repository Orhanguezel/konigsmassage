'use client';

import React, { useEffect, useMemo, useState } from 'react';

// RTK
import { useCreateReviewPublicMutation, useListReviewsPublicQuery } from '@/integrations/rtk/hooks';
import type { ReviewDto } from '@/integrations/shared';

// Helpers
import { excerpt } from '@/shared/text';

// i18n
import { useResolvedLocale } from '@/i18n/locale';
import { useUiSection } from '@/i18n/uiDb';

import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconStar,
  IconX,
} from '@/components/ui/icons';

type FeedbackSlide = {
  id: string;
  name: string;
  text: string;
  rating: number;
};

// --- Helpers ---
function safeStr(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v == null) return '';
  return String(v).trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(email || '')
      .trim()
      .toLowerCase(),
  );
}

function clampRating(n: number): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return 5;
  return Math.max(1, Math.min(5, x));
}

const TARGET_TYPE = 'testimonial';
const TARGET_ID = 'konigsmassage';

const Feedback: React.FC = () => {
  const locale = useResolvedLocale();
  const { ui } = useUiSection('ui_feedback', locale);

  // --- Data ---
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

  const [createReview, { isLoading: isCreating }] = useCreateReviewPublicMutation();

  // --- State ---
  const [isOpen, setIsOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRating, setFormRating] = useState<number>(5);
  const [formComment, setFormComment] = useState('');
  const [submitState, setSubmitState] = useState<
    { type: 'idle' } | { type: 'success' } | { type: 'error'; message: string }
  >({ type: 'idle' });
  const [activeIdx, setActiveIdx] = useState(0);

  // --- Effects ---
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // --- Memoized Data ---
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
      subprefix: String(ui('ui_feedback_subprefix') ?? ''),
      sublabel: String(ui('ui_feedback_sublabel') ?? ''),
      title: String(ui('ui_feedback_title') ?? ''),
      paragraph: String(ui('ui_feedback_paragraph') ?? ''),
      prev: String(ui('ui_feedback_prev') ?? 'Previous'),
      next: String(ui('ui_feedback_next') ?? 'Next'),
      writeBtn: String(ui('ui_feedback_write_button') ?? ''),
      modalTitle: String(ui('ui_feedback_modal_title') ?? ''),
      close: String(ui('ui_common_close') ?? 'Close'),
      submit: String(ui('ui_feedback_submit') ?? 'Submit'),
      sending: String(ui('ui_feedback_sending') ?? 'Sending...'),
      fName: String(ui('ui_feedback_field_name') ?? 'Name'),
      fEmail: String(ui('ui_feedback_field_email') ?? 'Email'),
      fRating: String(ui('ui_feedback_field_rating') ?? 'Rating'),
      fComment: String(ui('ui_feedback_field_comment') ?? 'Comment'),
      errName: String(ui('ui_feedback_error_name') ?? 'Name required'),
      errEmail: String(ui('ui_feedback_error_email') ?? 'Invalid email'),
      errComment: String(ui('ui_feedback_error_comment') ?? 'Comment required'),
      errGeneric: String(ui('ui_feedback_error_generic') ?? 'Error occurred'),
      okMsg: String(ui('ui_feedback_success') ?? 'Review submitted successfully!'),
    }),
    [ui],
  );

  const modalTitleId = 'feedback-modal-title';
  const modalDescId = 'feedback-modal-desc';

  // --- Handlers ---
  const openModal = () => {
    setSubmitState({ type: 'idle' });
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => {
      setSubmitState({ type: 'idle' });
      setFormName('');
      setFormEmail('');
      setFormRating(5);
      setFormComment('');
    }, 300);
  };

  const canSubmit = useMemo(() => {
    const nameOk = safeStr(formName).length > 0;
    const emailOk = isValidEmail(formEmail);
    const commentOk = safeStr(formComment).length > 0;
    return nameOk && emailOk && commentOk && !isCreating;
  }, [formName, formEmail, formComment, isCreating]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState({ type: 'idle' });

    const name = safeStr(formName);
    const email = safeStr(formEmail).toLowerCase();
    const rating = clampRating(formRating);
    const comment = safeStr(formComment);

    if (!name) return setSubmitState({ type: 'error', message: t.errName });
    if (!isValidEmail(email)) return setSubmitState({ type: 'error', message: t.errEmail });
    if (!comment) return setSubmitState({ type: 'error', message: t.errComment });

    try {
      await createReview({
        target_type: TARGET_TYPE,
        target_id: TARGET_ID,
        locale,
        name,
        email,
        rating,
        comment,
      }).unwrap();

      setSubmitState({ type: 'success' });
      // Clear form right away on success?
      // Maybe keep it visible so they see the success message.
      setFormName('');
      setFormEmail('');
      setFormComment('');
      setFormRating(5);
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.data?.message || err?.error || t.errGeneric;
      setSubmitState({ type: 'error', message: safeStr(msg) || t.errGeneric });
    }
  };

  const renderStars = (rating: number, interactive = false, setRating?: (r: number) => void) => {
    const currentRating = clampRating(rating);
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const idx = i + 1;
          const filled = idx <= currentRating;
          return interactive && setRating ? (
            <button
              key={`star-${idx}`}
              type="button"
              className={`transition-all duration-200 ${filled ? 'text-brand-primary scale-105' : 'text-sand-300 hover:text-brand-primary'}`}
              onClick={() => setRating(idx)}
              aria-label={`Rate ${idx}`}
            >
              <IconStar filled={filled} size={22} />
            </button>
          ) : (
            <IconStar
              key={`s-${i}`}
              filled={filled}
              size={18}
              className={filled ? 'text-brand-primary' : 'text-sand-300'}
            />
          );
        })}
      </div>
    );
  };

  // If loading or empty, we generally want to hide whole section or show skeleton.
  // Original only returned null if empty AND not loading.
  const shouldRender = isLoading || slides.length > 0;

  useEffect(() => {
    if (isOpen) return;
    if (isLoading) return;
    if (slides.length <= 1) return;

    const id = window.setInterval(() => {
      setActiveIdx((p) => (p + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(id);
  }, [isOpen, isLoading, slides.length]);

  if (!shouldRender) return null;

  const effectiveIdx = slides.length
    ? ((activeIdx % slides.length) + slides.length) % slides.length
    : 0;
  const active = slides[effectiveIdx];

  return (
    <section className="bg-bg-primary py-20 lg:py-32 overflow-hidden relative">
      {/* Background Decorative Elem */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-sand-50/50 -skew-x-12 translate-x-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
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
                  className="feedback-prev w-12 h-12 flex items-center justify-center rounded-full border border-sand-300 text-text-primary hover:bg-brand-primary hover:border-brand-primary hover:text-white transition-all duration-300"
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
                  className="feedback-next w-12 h-12 flex items-center justify-center rounded-full border border-sand-300 text-text-primary hover:bg-brand-primary hover:border-brand-primary hover:text-white transition-all duration-300"
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
                onClick={openModal}
                className="inline-flex items-center justify-center px-8 py-3 bg-brand-primary text-white font-medium uppercase tracking-wider hover:bg-brand-dark transition-all duration-300 rounded-sm shadow-sm hover:shadow-md"
              >
                {t.writeBtn}
              </button>
            </div>
          </div>

          {/* Slider */}
          <div className="w-full" data-aos="fade-left">
            <div className="relative">
              {isLoading ? (
                <div className="w-full bg-sand-50 rounded-2xl p-10 h-80 animate-pulse" />
              ) : (
                <div className="bg-sand-50 p-8 md:p-12 rounded-2xl border border-sand-200 shadow-sm relative">
                  <div className="text-sand-300/30 absolute top-6 right-8 text-9xl font-serif leading-none select-none pointer-events-none">
                    ”
                  </div>

                  <div className="mb-6">{active ? renderStars(active.rating) : null}</div>

                  <p className="text-xl text-text-secondary font-medium italic leading-relaxed mb-8 relative z-10">
                    {active ? `"${active.text}"` : ''}
                  </p>

                  <div>
                    <p className="text-text-primary font-bold text-lg">{active?.name || ''}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isOpen ? (
        <div
          className="fixed inset-0 z-[10060] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalTitleId}
          aria-describedby={modalDescId}
        >
          <button
            type="button"
            onClick={closeModal}
            aria-label={t.close || 'Close'}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-sand-200 flex items-center justify-between bg-sand-50">
              <p id={modalTitleId} className="text-xl font-serif font-bold text-brand-dark">
                {t.modalTitle}
              </p>
              <button
                type="button"
                onClick={closeModal}
                aria-label={t.close || 'Close'}
                className="p-2 -mr-2 text-text-secondary hover:text-brand-dark transition-colors"
              >
                <IconX size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <p id={modalDescId} className="sr-only">
                {t.modalTitle}
              </p>
              <form onSubmit={submitReview} className="space-y-5">
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-1">
                    <label
                      htmlFor="feedback-name"
                      className="text-sm font-semibold text-text-primary"
                    >
                      {t.fName}
                    </label>
                    <input
                      id="feedback-name"
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-sand-300 bg-white text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="feedback-email"
                      className="text-sm font-semibold text-text-primary"
                    >
                      {t.fEmail}
                    </label>
                    <input
                      id="feedback-email"
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-sand-300 bg-white text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-text-primary">{t.fRating}</label>
                    <div className="py-1">{renderStars(formRating, true, setFormRating)}</div>
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="feedback-comment"
                      className="text-sm font-semibold text-text-primary"
                    >
                      {t.fComment}
                    </label>
                    <textarea
                      id="feedback-comment"
                      rows={4}
                      required
                      value={formComment}
                      onChange={(e) => setFormComment(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-sand-300 bg-white text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Status Messages */}
                {submitState.type === 'success' ? (
                  <div className="bg-green-50 text-green-800 p-4 rounded-lg flex items-start gap-3">
                    <IconCheck className="mt-0.5" size={18} />
                    <p className="text-sm font-medium">{t.okMsg}</p>
                  </div>
                ) : null}
                {submitState.type === 'error' ? (
                  <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-start gap-3">
                    <IconX className="mt-0.5" size={18} />
                    <p className="text-sm font-medium">{submitState.message}</p>
                  </div>
                ) : null}

                {/* Footer */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-sand-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-brand-dark hover:bg-sand-100 rounded-lg transition-colors"
                  >
                    {t.close}
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit || isCreating}
                    className="px-6 py-2.5 text-sm font-medium bg-brand-primary text-white rounded-lg shadow hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isCreating ? t.sending : t.submit}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Feedback;
