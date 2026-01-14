// =============================================================
// FILE: src/components/containers/feedback/Feedback.tsx
// FIX: Hooks order (no conditional hook calls)
// =============================================================
'use client';

import React, { useEffect, useMemo, useState } from 'react';

// Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper';
import 'swiper/css';

// Icons
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';

// RTK – Public reviews
import { useCreateReviewPublicMutation, useListReviewsPublicQuery } from '@/integrations/rtk/hooks';
import type { ReviewCreatePayload, ReviewDto } from '@/integrations/types';

// Helpers
import { excerpt } from '@/shared/text';

// i18n
import { useResolvedLocale } from '@/i18n/locale';
import { useUiSection } from '@/i18n/uiDb';

type FeedbackSlide = {
  id: string;
  name: string;
  text: string;
  rating: number;
};

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

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRating, setFormRating] = useState<number>(5);
  const [formComment, setFormComment] = useState('');

  const [submitState, setSubmitState] = useState<
    { type: 'idle' } | { type: 'success' } | { type: 'error'; message: string }
  >({ type: 'idle' });

  // ESC close
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const slides: FeedbackSlide[] = useMemo(() => {
    const list: ReviewDto[] = Array.isArray(data) ? data : [];
    return list.map((r) => ({
      id: String(r.id),
      name: safeStr(r.name),
      text: excerpt(safeStr(r.comment), 280),
      rating: clampRating(Number(r.rating || 5)) | 0,
    }));
  }, [data]);

  // IMPORTANT: t must be computed unconditionally (before any early return)
  const t = useMemo(
    () => ({
      subprefix: String(ui('ui_feedback_subprefix') ?? ''),
      sublabel: String(ui('ui_feedback_sublabel') ?? ''),
      title: String(ui('ui_feedback_title') ?? ''),
      paragraph: String(ui('ui_feedback_paragraph') ?? ''),

      prev: String(ui('ui_feedback_prev') ?? ''),
      next: String(ui('ui_feedback_next') ?? ''),

      writeBtn: String(ui('ui_feedback_write_button') ?? ''),

      // modal
      modalTitle: String(ui('ui_feedback_modal_title') ?? ''),
      close: String(ui('ui_common_close') ?? ''),
      submit: String(ui('ui_feedback_submit') ?? ''),
      sending: String(ui('ui_feedback_sending') ?? ''),

      fName: String(ui('ui_feedback_field_name') ?? ''),
      fEmail: String(ui('ui_feedback_field_email') ?? ''),
      fRating: String(ui('ui_feedback_field_rating') ?? ''),
      fComment: String(ui('ui_feedback_field_comment') ?? ''),

      errName: String(ui('ui_feedback_error_name') ?? ''),
      errEmail: String(ui('ui_feedback_error_email') ?? ''),
      errComment: String(ui('ui_feedback_error_comment') ?? ''),
      errGeneric: String(ui('ui_feedback_error_generic') ?? ''),

      okMsg: String(ui('ui_feedback_success') ?? ''),
    }),
    [ui],
  );

  const openModal = () => {
    setSubmitState({ type: 'idle' });
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSubmitState({ type: 'idle' });
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

    const payload: ReviewCreatePayload = {
      target_type: TARGET_TYPE,
      target_id: TARGET_ID,
      locale,
      name,
      email,
      rating,
      comment,
    };

    try {
      await createReview(payload).unwrap();

      setSubmitState({ type: 'success' });

      setFormName('');
      setFormEmail('');
      setFormRating(5);
      setFormComment('');
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.data?.message || err?.error || t.errGeneric;
      setSubmitState({ type: 'error', message: safeStr(msg) || t.errGeneric });
    }
  };

  const renderStars = (rating: number) => {
    const r = clampRating(rating);
    return (
      <>
        {Array.from({ length: 5 }).map((_, i) => {
          const idx = i + 1;
          const filled = idx <= r;
          return <FaStar key={`s-${i}`} className={filled ? 'is-filled' : 'is-empty'} />;
        })}
      </>
    );
  };

  // NO FALLBACKS: if empty and not loading => render nothing
  const shouldRender = isLoading || slides.length > 0;
  if (!shouldRender) return null;

  return (
    <section className="feedback__area pt-120 pb-60 bg-white">
      <div className="container">
        <div className="row" data-aos="fade-up" data-aos-delay="300">
          {/* LEFT */}
          <div className="col-xl-6 col-lg-6">
            <div className="feedback__content-wrapper mb-60">
              <div className="section__title-wrapper">
                <span className="section__subtitle">
                  <span>{t.subprefix} </span>
                  {t.sublabel}
                </span>
                <h2 className="section__title mb-30">{t.title}</h2>
              </div>

              <p>{t.paragraph}</p>

              <div className="d-flex flex-wrap gap-3 align-items-center mt-30">
                <div className="feedback__navigation ens-circle-nav">
                  <button
                    className="feedback-3__button-prev ens-circle-arrow"
                    aria-label={t.prev}
                    type="button"
                  >
                    <FiChevronLeft />
                  </button>
                  <button
                    className="feedback-3__button-next ens-circle-arrow"
                    aria-label={t.next}
                    type="button"
                  >
                    <FiChevronRight />
                  </button>
                </div>

                <div className="feedback__write">
                  <button type="button" className="border__btn" onClick={openModal}>
                    {t.writeBtn}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="col-xl-6 col-lg-6">
            <div className="feedback__right mb-60">
              <div className="feedbacK__content-wrapper">
                <div className="feedback__active">
                  <Swiper
                    slidesPerView={1}
                    spaceBetween={30}
                    loop={slides.length > 1}
                    roundLengths
                    modules={[Autoplay, Navigation]}
                    autoplay={{ delay: 5000, disableOnInteraction: false }}
                    navigation={{
                      nextEl: '.feedback-3__button-next',
                      prevEl: '.feedback-3__button-prev',
                    }}
                    className="feedback__active-three"
                  >
                    {(isLoading ? slides.slice(0, 1) : slides).map((s) => (
                      <SwiperSlide key={s.id}>
                        <div className="feedbacK__content">
                          <div className="feedback__review-icon" aria-hidden="true">
                            {renderStars(s.rating)}
                          </div>

                          <p>{s.text}</p>

                          <div className="feedback__meta">
                            <div className="feedback__meta-author">
                              <h5>{s.name}</h5>
                            </div>
                          </div>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>

                {isLoading && <div className="skeleton-line mt-10" aria-hidden />}
              </div>
            </div>
          </div>
          {/* /RIGHT */}
        </div>
      </div>

      {/* MODAL */}
      {isOpen && (
        <div
          className="modal-backdrop-custom"
          role="dialog"
          aria-modal="true"
          aria-label={t.modalTitle}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="modal-card-custom">
            <div className="modal-head-custom">
              <div className="modal-title-custom">{t.modalTitle}</div>

              <button
                type="button"
                className="btn btn-link modal-close-custom"
                onClick={closeModal}
                aria-label={t.close}
                title={t.close}
              >
                ×
              </button>
            </div>

            <div className="modal-body-custom">
              <form onSubmit={submitReview}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">{t.fName}</label>
                    <input
                      className="form-control"
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">{t.fEmail}</label>
                    <input
                      className="form-control"
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">{t.fRating}</label>
                    <div className="ens-rating-picker" role="radiogroup" aria-label={t.fRating}>
                      {Array.from({ length: 5 }).map((_, i) => {
                        const v = i + 1;
                        const active = v <= formRating;
                        return (
                          <button
                            key={`r-${v}`}
                            type="button"
                            className={`ens-rating-star ${active ? 'is-active' : ''}`}
                            onClick={() => setFormRating(v)}
                            aria-label={`${v}/5`}
                            aria-pressed={active}
                          >
                            <FaStar />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label">{t.fComment}</label>
                    <textarea
                      className="form-control"
                      rows={5}
                      value={formComment}
                      onChange={(e) => setFormComment(e.target.value)}
                    />
                  </div>

                  <div className="col-12">
                    <div className="d-flex gap-2 justify-content-end">
                      <button type="button" className="border__btn" onClick={closeModal}>
                        {t.close}
                      </button>

                      <button type="submit" className="solid__btn" disabled={!canSubmit}>
                        {isCreating ? t.sending : t.submit}
                      </button>
                    </div>
                  </div>

                  {submitState.type === 'success' && (
                    <div className="col-12">
                      <div className="alert alert-success mb-0">{t.okMsg}</div>
                    </div>
                  )}

                  {submitState.type === 'error' && (
                    <div className="col-12">
                      <div className="alert alert-danger mb-0">{submitState.message}</div>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* /MODAL */}
    </section>
  );
};

export default Feedback;
