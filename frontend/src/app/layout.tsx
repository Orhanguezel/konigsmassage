import './globals.css';
import React from 'react';
import type { Metadata } from 'next';
import { fetchSetting } from '@/i18n/server';

function extractUrl(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') {
    const s = val.trim();
    if (s.startsWith('{')) {
      try { return (JSON.parse(s) as { url?: string }).url || ''; } catch { return s; }
    }
    return s;
  }
  if (typeof val === 'object') return String((val as { url?: string }).url || '');
  return '';
}

export async function generateMetadata(): Promise<Metadata> {
  const favicon = await fetchSetting('site_favicon', '*');
  const faviconUrl = extractUrl(favicon?.value) || '/favicon.svg';

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://koenigsmassage.com'),
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
