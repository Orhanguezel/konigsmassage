'use client';

import React from 'react';
import Link from 'next/link';
import { useLocaleShort } from '@/i18n';
import { localizePath } from '@/integrations/shared';
import { useListGutscheinProductsQuery } from '@/integrations/rtk/hooks';

type Props = { locale?: string };

const COPY: Record<string, { title: string; desc: string; customLabel: string; cta: string }> = {
  de: {
    title: 'Gutscheine verschenken',
    desc: 'Bereiten Sie jemandem eine Freude mit einem Gutschein für unsere Massagen und Wellnessbehandlungen. Wählen Sie einen Festbetrag oder geben Sie Ihren Wunschbetrag ein.',
    customLabel: 'Wunschbetrag',
    cta: 'Gutschein kaufen',
  },
  tr: {
    title: 'Hediye Çeki Ver',
    desc: 'Masaj ve wellness hizmetlerimiz için bir hediye çeki ile birilerini mutlu edin. Sabit tutarlardan birini seçin veya istediğiniz tutarı girin.',
    customLabel: 'Özel tutar',
    cta: 'Hediye Çeki Al',
  },
  en: {
    title: 'Give a Gift Voucher',
    desc: 'Delight someone special with a voucher for our massage and wellness treatments. Choose a fixed amount or enter your own.',
    customLabel: 'Custom amount',
    cta: 'Buy a Voucher',
  },
};

export default function GutscheinHomeCta({ locale: explicitLocale }: Props) {
  const locale = useLocaleShort(explicitLocale) || 'de';
  const copy = COPY[locale] ?? COPY['de'];

  const { data: products } = useListGutscheinProductsQuery();
  const activeProducts = (products ?? []).filter((p) => p.is_active);

  // Build chips from DB products (sorted by value), then append custom-amount chip
  const intlLocale = locale === 'tr' ? 'tr-TR' : locale === 'en' ? 'en-US' : 'de-DE';
  const chips: string[] = activeProducts.map((p) =>
    new Intl.NumberFormat(intlLocale, { style: 'currency', currency: p.currency, maximumFractionDigits: 0 }).format(parseFloat(p.value))
  );
  chips.push(copy.customLabel);

  return (
    <div className="bg-white rounded-2xl border border-sand-200 shadow-soft p-8 md:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
      <div className="max-w-2xl">
        {/* Gift icon */}
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-2xl">
          🎁
        </div>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-dark mb-3">
          {copy.title}
        </h2>
        <p className="text-text-secondary text-lg leading-relaxed mb-5">{copy.desc}</p>

        {/* Amount chips — from DB, fallback to empty until loaded */}
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-brand-primary/30 bg-brand-light px-4 py-1.5 text-sm font-semibold text-brand-dark"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      <Link
        href={localizePath(locale, '/gutschein')}
        className="shrink-0 inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-primary text-white font-bold uppercase tracking-wider rounded-lg hover:bg-brand-hover transition-colors shadow-sm"
      >
        <span>🎁</span>
        {copy.cta}
      </Link>
    </div>
  );
}
