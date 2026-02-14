import React from 'react';
import { getServerI18nContext } from '@/i18n/server';
import { NotFoundContent } from '@/components/common/public/NotFoundContent';
import { Providers } from './providers';
import ClientLayout from './ClientLayout';

export default async function RootNotFound() {
  const { detectedLocale } = await getServerI18nContext();
  
  const dummyT = (k: string, fb: string) => fb;

  return (
    <Providers>
      <ClientLayout locale={detectedLocale}>
        <NotFoundContent 
          locale={detectedLocale} 
          ui={dummyT} 
          homePath={`/${detectedLocale}`} 
        />
      </ClientLayout>
    </Providers>
  );
}
