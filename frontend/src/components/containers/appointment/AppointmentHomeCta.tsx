'use client';

import React from 'react';
import Link from 'next/link';

import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { localizePath } from '@/i18n/url';

export default function AppointmentHomeCta() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_appointment', locale as any);

  const title = ui('ui_appointment_home_cta_title', ui('ui_appointment_title', 'Randevu Al'));
  const desc = ui(
    'ui_appointment_home_cta_desc',
    ui('ui_appointment_desc', 'Size uygun zamanı seçerek kolayca randevu oluşturabilirsiniz.'),
  );
  const cta = ui('ui_appointment_home_cta_btn', ui('ui_appointment_title', 'Randevu Al'));

  return (
    <div className="bg-white rounded-2xl border border-sand-200 shadow-soft p-8 md:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
      <div className="max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-dark mb-3">{title}</h2>
        <p className="text-text-secondary text-lg leading-relaxed">{desc}</p>
      </div>

      <Link
        href={localizePath(locale, '/appointment')}
        className="inline-flex items-center justify-center px-8 py-4 bg-brand-primary text-white font-bold uppercase tracking-wider rounded-lg hover:bg-brand-hover transition-colors shadow-sm"
      >
        {cta}
      </Link>
    </div>
  );
}

