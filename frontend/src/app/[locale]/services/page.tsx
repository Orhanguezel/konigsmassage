'use client';

import React, { useMemo } from 'react';
import Banner from '@/layout/banner/Breadcrum';
import Service from '@/components/containers/services/Service';
import ServiceMore from '@/components/containers/services/ServiceMore';
import { LayoutSeoBridge } from '@/seo';
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { isValidUiText } from '@/i18n/uiText';
import { toCdnSrc } from '@/shared/media';
import { safeStr } from '@/integrations/shared';

export default function ServicesPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_services', locale as any);

  const bannerTitle = useMemo(() => {
    const key = 'ui_services_page_title';
    const v = safeStr(ui(key, 'Masaj Çeşitleri'));
    return isValidUiText(v, key) ? v : 'Masaj Çeşitleri';
  }, [ui]);

  const pageTitle = useMemo(() => {
    const key = 'ui_services_meta_title';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;
    return bannerTitle || 'Masaj Çeşitleri';
  }, [ui, bannerTitle]);

  const pageDescription = useMemo(() => {
    const key = 'ui_services_meta_description';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;

    return safeStr(
      ui(
        'ui_services_meta_description_fallback',
        'Masaj çeşitlerimizi keşfedin. Randevu ve detaylı bilgi için bizimle iletişime geçin.',
      ),
    );
  }, [ui]);

  const ogImageOverride = useMemo(() => {
    const key = 'ui_services_og_image';
    const raw = safeStr(ui(key, ''));
    if (!raw) return undefined;
    if (/^https?:\/\//i.test(raw)) return raw;
    return toCdnSrc(raw, 1200, 630, 'fill') || raw;
  }, [ui]);

  return (
    <>
      <LayoutSeoBridge
        title={pageTitle}
        description={pageDescription || undefined}
        ogImage={ogImageOverride}
        noindex={false}
      />

      <Banner title={bannerTitle} />

      <div className="bg-bg-accent min-h-[50vh]">
        <section className="container mx-auto py-16 px-4">
          <Service />
        </section>

        <section className="container mx-auto pb-16 px-4">
          <ServiceMore />
        </section>
      </div>
    </>
  );
}
