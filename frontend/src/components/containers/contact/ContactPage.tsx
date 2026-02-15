// =============================================================
// FILE: src/components/containers/contact/ContactPage.tsx
// konigsmassage – Public Contact Page (I18N + DB-driven)
// - Uses contacts public endpoint: POST /contacts
// - Uses site_settings: ui_contact + contact_info + contact_map
// - Token-based Tailwind v4 styling
// =============================================================

'use client';

import React, { useCallback, useId, useMemo, useState } from 'react';

import { toast } from 'sonner';

import {
  useCreateContactPublicMutation,
  useGetSiteSettingByKeyQuery,
} from '@/integrations/rtk/hooks';
import type { ContactCreatePayload } from '@/integrations/shared';

import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { localizePath } from '@/i18n/url';
import { safeStr } from '@/integrations/shared';

type ContactInfo = Partial<{
  companyName: string;
  phones: string[];
  email: string;
  address: string;
  addressSecondary: string;
  whatsappNumber: string;
  website: string;
  notes: string;
}>;

function tryParseJson<T>(v: unknown): T | null {
  try {
    if (!v) return null;
    if (typeof v === 'object') return v as T;
    const s = safeStr(v);
    if (!s) return null;
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => safeStr(x)).filter(Boolean);
  return [];
}

function buildMailto(email: string, subject?: string) {
  const e = safeStr(email);
  if (!e) return '';
  const s = safeStr(subject);
  return `mailto:${encodeURIComponent(e)}${s ? `?subject=${encodeURIComponent(s)}` : ''}`;
}

export default function ContactPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_contact', locale as any);

  const t = useMemo(
    () => ({
      subprefix: ui('ui_contact_subprefix', 'KÖNIG ENERGETIK'),
      sublabel: ui('ui_contact_sublabel', 'Contact'),
      titleLeft: ui('ui_contact_title_left', 'Contact'),
      tagline: ui(
        'ui_contact_tagline',
        'For questions and appointment requests, send a message. Sessions are arranged after a short pre-chat and consent.',
      ),

      formTitle: ui('ui_contact_form_title', 'Send a message'),
      firstName: ui('ui_contact_first_name', 'First name*'),
      lastName: ui('ui_contact_last_name', 'Last name'),
      phone: ui('ui_contact_phone', 'Phone*'),
      email: ui('ui_contact_email', 'Email*'),
      subject: ui('ui_contact_subject_label', 'Subject*'),
      message: ui('ui_contact_message_label', 'Message*'),
      messagePh: ui('ui_contact_message_placeholder', 'Write your message...'),

      topicLabel: ui('ui_contact_select_label', 'Topic'),
      topicAppointment: ui('ui_contact_service_cooling_towers', 'Appointment request'),
      topicQuestion: ui('ui_contact_service_maintenance', 'Question'),
      topicCollab: ui('ui_contact_service_modernization', 'Collaboration'),
      topicOther: ui('ui_contact_service_other', 'Other'),

      termsPrefix: ui('ui_contact_terms_prefix', 'I agree to the:'),
      terms: ui('ui_contact_terms', 'Privacy Policy'),
      conditions: ui('ui_contact_conditions', 'Terms'),

      submit: ui('ui_contact_submit', 'Send'),
      sending: ui('ui_contact_sending', 'Sending...'),
      success: ui('ui_contact_success', 'Thanks! Your message has been sent.'),
      errorGeneric: ui('ui_contact_error_generic', 'Failed to send. Please try again.'),

      errRequired: ui('ui_contact_error_required', 'This field is required.'),
      errEmail: ui('ui_contact_error_email', 'Please enter a valid email address.'),
      errPhone: ui('ui_contact_error_phone', 'Please enter a valid phone number.'),
      errMinMessage: ui(
        'ui_contact_error_message',
        'Please write a message (at least 10 characters).',
      ),

      mapTitle: ui('ui_contact_map_title', 'Location'),
      infoTitle: ui('ui_contact_info_title', 'Contact info'),
      infoNoteTitle: ui('ui_contact_info_note_title', 'Note'),
    }),
    [ui],
  );

  // contact_info (localized)
  const { data: contactInfoRaw } = useGetSiteSettingByKeyQuery({
    key: 'contact_info',
    locale,
  } as any);
  const contactInfo = useMemo<ContactInfo>(() => {
    const v = (contactInfoRaw as any)?.value ?? contactInfoRaw;
    const parsed = tryParseJson<ContactInfo>(v) ?? {};
    return parsed;
  }, [contactInfoRaw]);

  const phones = useMemo(() => asArray((contactInfo as any)?.phones), [contactInfo]);
  const primaryPhone = useMemo(() => safeStr(phones[0]), [phones]);
  const emailTo = useMemo(() => safeStr((contactInfo as any)?.email), [contactInfo]);
  const address = useMemo(() => safeStr((contactInfo as any)?.address), [contactInfo]);
  const address2 = useMemo(() => safeStr((contactInfo as any)?.addressSecondary), [contactInfo]);
  const notes = useMemo(() => safeStr((contactInfo as any)?.notes), [contactInfo]);

  // contact_map (localized)
  const { data: mapRaw } = useGetSiteSettingByKeyQuery({ key: 'contact_map', locale } as any);
  const mapCfg = useMemo(() => {
    const v = (mapRaw as any)?.value ?? mapRaw;
    const parsed = tryParseJson<any>(v) ?? {};
    return {
      title: safeStr(parsed.title) || t.mapTitle,
      height: Number(parsed.height) || 420,
      query: safeStr(parsed.query),
      embed_url: safeStr(parsed.embed_url),
    };
  }, [mapRaw, t.mapTitle]);

  const privacyHref = useMemo(() => localizePath(locale, '/privacy-policy'), [locale]);
  const termsHref = useMemo(() => localizePath(locale, '/terms'), [locale]);

  // form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<'appointment' | 'question' | 'collab' | 'other'>(
    'appointment',
  );
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [agree, setAgree] = useState(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched((p) => ({ ...p, [k]: true }));

  const topicLabel = useMemo(() => {
    if (topic === 'appointment') return safeStr(t.topicAppointment);
    if (topic === 'question') return safeStr(t.topicQuestion);
    if (topic === 'collab') return safeStr(t.topicCollab);
    return safeStr(t.topicOther);
  }, [topic, t.topicAppointment, t.topicQuestion, t.topicCollab, t.topicOther]);

  const computedSubject = useMemo(() => {
    const s = safeStr(subject);
    if (s) return s;
    const base = safeStr(ui('ui_contact_subject_base', 'Contact Message')) || 'Contact Message';
    return topicLabel ? `${base} — ${topicLabel}` : base;
  }, [subject, ui, topicLabel]);

  const fullName = useMemo(() => {
    const a = safeStr(firstName);
    const b = safeStr(lastName);
    return [a, b].filter(Boolean).join(' ').trim();
  }, [firstName, lastName]);

  const hasError = useCallback(
    (field: 'firstName' | 'phone' | 'email' | 'message' | 'agree') => {
      if (!touched[field]) return false;
      if (field === 'firstName') return fullName.length < 2;
      if (field === 'phone') return safeStr(phone).length < 5;
      if (field === 'email') return !safeStr(email).includes('@');
      if (field === 'message') return safeStr(message).length < 10;
      if (field === 'agree') return !agree;
      return false;
    },
    [touched, fullName, phone, email, message, agree],
  );

  const [createContact, { isLoading }] = useCreateContactPublicMutation();

  const formId = useId();
  const firstId = `${formId}-first`;
  const lastId = `${formId}-last`;
  const phoneId = `${formId}-phone`;
  const emailId = `${formId}-email`;
  const topicId = `${formId}-topic`;
  const subjectId = `${formId}-subject`;
  const msgId = `${formId}-msg`;
  const agreeId = `${formId}-agree`;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ firstName: true, phone: true, email: true, message: true, agree: true });

    if (
      fullName.length < 2 ||
      safeStr(phone).length < 5 ||
      !safeStr(email).includes('@') ||
      safeStr(message).length < 10 ||
      !agree
    ) {
      return;
    }

    const payload: ContactCreatePayload = {
      name: fullName,
      email: safeStr(email),
      phone: safeStr(phone),
      subject: computedSubject,
      message: safeStr(message),
      website: '',
    };

    try {
      await createContact(payload).unwrap();
      toast.success(safeStr(t.success) || 'Sent');

      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setTopic('appointment');
      setSubject('');
      setMessage('');
      setAgree(false);
      setTouched({});
    } catch (err) {
      console.error('createContact error', err);
      toast.error(safeStr(t.errorGeneric) || 'Failed');
    }
  };

  return (
    <section className="bg-bg-primary py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left */}
          <div className="lg:col-span-5">
            <div className="mb-8">
              <div className="text-sm font-bold uppercase tracking-widest text-brand-primary mb-3">
                <span>{safeStr(t.subprefix) || 'KÖNIG ENERGETIK'}</span>{' '}
                <span className="text-text-muted">{safeStr(t.sublabel)}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-text-primary mb-4">
                {safeStr(t.titleLeft)}
              </h2>
              <p className="text-text-secondary leading-relaxed">{safeStr(t.tagline)}</p>
            </div>

            {/* Contact info */}
            <div className="bg-bg-secondary rounded-xl shadow-soft border border-border-light p-6 mb-8">
              <h3 className="text-lg font-bold font-serif text-text-primary mb-4">
                {safeStr(t.infoTitle)}
              </h3>

              <div className="space-y-3 text-sm text-text-secondary">
                {primaryPhone ? (
                  <div>
                    <strong className="text-text-primary">{safeStr(t.phone)}:</strong>{' '}
                    <a className="text-brand-primary hover:underline" href={`tel:${primaryPhone}`}>
                      {primaryPhone}
                    </a>
                  </div>
                ) : null}

                {emailTo ? (
                  <div>
                    <strong className="text-text-primary">{safeStr(t.email)}:</strong>{' '}
                    <a
                      className="text-brand-primary hover:underline"
                      href={buildMailto(emailTo, computedSubject)}
                    >
                      {emailTo}
                    </a>
                  </div>
                ) : null}

                {address ? (
                  <div>
                    <strong className="text-text-primary">
                      {safeStr(ui('ui_contact_address_label', 'Address'))}:
                    </strong>{' '}
                    <span>{address}</span>
                    {address2 ? <span className="block">{address2}</span> : null}
                  </div>
                ) : null}

                {notes ? (
                  <div className="pt-3 border-t border-border-light">
                    <strong className="text-text-primary">{safeStr(t.infoNoteTitle)}:</strong>
                    <div className="mt-1">{notes}</div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Map */}
            {mapCfg.embed_url ? (
              <div className="bg-bg-secondary rounded-xl shadow-soft border border-border-light overflow-hidden">
                <div className="px-6 py-4 border-b border-border-light">
                  <h3 className="text-lg font-bold font-serif text-text-primary">{mapCfg.title}</h3>
                </div>
                <iframe
                  title={mapCfg.title}
                  src={mapCfg.embed_url}
                  height={mapCfg.height}
                  className="w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : null}
          </div>

          {/* Right – form */}
          <div className="lg:col-span-7">
            <div className="bg-bg-secondary rounded-xl shadow-soft border border-border-light p-6 md:p-8">
              <h3 className="text-xl font-bold font-serif text-text-primary mb-6">
                {safeStr(t.formTitle)}
              </h3>

              <form onSubmit={onSubmit} noValidate className="space-y-5">
                {/* Honeypot */}
                <div className="hidden" aria-hidden="true">
                  <label>
                    Website
                    <input tabIndex={-1} autoComplete="off" name="website" />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-semibold text-text-primary mb-2"
                      htmlFor={firstId}
                    >
                      {safeStr(t.firstName)}
                    </label>
                    <input
                      id={firstId}
                      className={[
                        'w-full px-4 py-3 rounded-lg border bg-bg-primary text-text-primary',
                        hasError('firstName') ? 'border-rose-400' : 'border-border-light',
                      ].join(' ')}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onBlur={() => touch('firstName')}
                      autoComplete="given-name"
                    />
                    {hasError('firstName') ? (
                      <p className="text-sm mt-2 text-rose-700">{safeStr(t.errRequired)}</p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-semibold text-text-primary mb-2"
                      htmlFor={lastId}
                    >
                      {safeStr(t.lastName)}
                    </label>
                    <input
                      id={lastId}
                      className="w-full px-4 py-3 rounded-lg border border-border-light bg-bg-primary text-text-primary"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-semibold text-text-primary mb-2"
                      htmlFor={emailId}
                    >
                      {safeStr(t.email)}
                    </label>
                    <input
                      id={emailId}
                      type="email"
                      className={[
                        'w-full px-4 py-3 rounded-lg border bg-bg-primary text-text-primary',
                        hasError('email') ? 'border-rose-400' : 'border-border-light',
                      ].join(' ')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => touch('email')}
                      autoComplete="email"
                    />
                    {hasError('email') ? (
                      <p className="text-sm mt-2 text-rose-700">{safeStr(t.errEmail)}</p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-semibold text-text-primary mb-2"
                      htmlFor={phoneId}
                    >
                      {safeStr(t.phone)}
                    </label>
                    <input
                      id={phoneId}
                      className={[
                        'w-full px-4 py-3 rounded-lg border bg-bg-primary text-text-primary',
                        hasError('phone') ? 'border-rose-400' : 'border-border-light',
                      ].join(' ')}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() => touch('phone')}
                      autoComplete="tel"
                    />
                    {hasError('phone') ? (
                      <p className="text-sm mt-2 text-rose-700">{safeStr(t.errPhone)}</p>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-semibold text-text-primary mb-2"
                      htmlFor={topicId}
                    >
                      {safeStr(t.topicLabel)}
                    </label>
                    <select
                      id={topicId}
                      className="w-full px-4 py-3 rounded-lg border border-border-light bg-bg-primary text-text-primary"
                      value={topic}
                      onChange={(e) =>
                        setTopic(e.target.value as 'appointment' | 'question' | 'collab' | 'other')
                      }
                    >
                      <option value="appointment">{safeStr(t.topicAppointment)}</option>
                      <option value="question">{safeStr(t.topicQuestion)}</option>
                      <option value="collab">{safeStr(t.topicCollab)}</option>
                      <option value="other">{safeStr(t.topicOther)}</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-semibold text-text-primary mb-2"
                      htmlFor={subjectId}
                    >
                      {safeStr(t.subject)}
                    </label>
                    <input
                      id={subjectId}
                      className="w-full px-4 py-3 rounded-lg border border-border-light bg-bg-primary text-text-primary"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={computedSubject}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="block text-sm font-semibold text-text-primary mb-2"
                    htmlFor={msgId}
                  >
                    {safeStr(t.message)}
                  </label>
                  <textarea
                    id={msgId}
                    className={[
                      'w-full px-4 py-3 rounded-lg border bg-bg-primary text-text-primary min-h-[140px]',
                      hasError('message') ? 'border-rose-400' : 'border-border-light',
                    ].join(' ')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onBlur={() => touch('message')}
                    placeholder={safeStr(t.messagePh)}
                  />
                  {hasError('message') ? (
                    <p className="text-sm mt-2 text-rose-700">{safeStr(t.errMinMessage)}</p>
                  ) : null}
                </div>

                <div>
                  <label
                    className="inline-flex items-start gap-3 text-sm text-text-secondary"
                    htmlFor={agreeId}
                  >
                    <input
                      id={agreeId}
                      type="checkbox"
                      className="mt-1"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      onBlur={() => touch('agree')}
                    />
                    <span>
                      {safeStr(t.termsPrefix)}{' '}
                      <a className="text-brand-primary hover:underline" href={privacyHref}>
                        {safeStr(t.terms)}
                      </a>
                      {safeStr(t.conditions) ? (
                        <>
                          {' '}
                          /{' '}
                          <a className="text-brand-primary hover:underline" href={termsHref}>
                            {safeStr(t.conditions)}
                          </a>
                        </>
                      ) : null}
                    </span>
                  </label>
                  {hasError('agree') ? (
                    <p className="text-sm mt-2 text-rose-700">{safeStr(t.errRequired)}</p>
                  ) : null}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center justify-center w-full md:w-auto px-8 py-4 bg-brand-primary text-text-on-dark font-bold uppercase tracking-widest hover:bg-brand-hover transition-all duration-300 shadow-soft rounded-sm disabled:opacity-60"
                  >
                    {isLoading ? safeStr(t.sending) : safeStr(t.submit)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
