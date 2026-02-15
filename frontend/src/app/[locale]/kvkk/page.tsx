'use client';

import React, { useMemo } from 'react';
import Banner from '@/layout/banner/Breadcrum';
import KvkkPageContent from '@/components/containers/legal/KvkkPageContent';
import { LayoutSeoBridge } from '@/seo';
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { isValidUiText } from '@/i18n/uiText';
import { safeStr } from '@/integrations/shared';

export default function KvkkPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_kvkk', locale as any);

  const bannerTitle = useMemo(() => {
    const key = 'ui_kvkk_page_title';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : 'KVKK';
  }, [ui]);

  return (
    <>
      <LayoutSeoBridge title={bannerTitle} noindex={false} />
      <Banner title={bannerTitle} />

      <section className="container mx-auto py-16 px-4 bg-bg-primary">
        <KvkkPageContent />
      </section>
    </>
  );
}
