'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useUiSection } from '@/i18n/uiDb';
import { localePath } from '@/i18n/routing';
import { NotFoundContent } from '@/components/common/public/NotFoundContent';

export default function NotFound() {
  const params = useParams();
  const locale = typeof params?.locale === 'string' ? params.locale : 'de';
  const { ui } = useUiSection('ui_errors', locale);
  
  return (
    <NotFoundContent 
      locale={locale} 
      ui={ui} 
      homePath={localePath('/', locale)} 
    />
  );
}
