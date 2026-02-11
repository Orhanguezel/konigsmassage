// =============================================================
// FILE: src/app/layout.tsx
// FINAL — RootLayout (fix hydration mismatch)
// - ThemeBootScript runs before interactive via next/script
// - suppressHydrationWarning on html + body to tolerate extension-added attrs
// - Avoid server/client className drift on <html>
// =============================================================

import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';

import { Toaster } from '@/components/ui/sonner';
import { APP_CONFIG } from '@/config/app-config';
import { fontVars } from '@/lib/fonts/registry';
import { PREFERENCE_DEFAULTS } from '@/lib/preferences/preferences-config';


import StoreProvider from '@/stores/Provider';
import { PreferencesStoreProvider } from '@/stores/preferences/preferences-provider';
import { LocaleProvider } from '@/i18n';

import './globals.css';

export const metadata: Metadata = {
  title: APP_CONFIG.meta.title,
  description: APP_CONFIG.meta.description,
};

function ThemeBootInlineScript() {
  const {
    theme_mode,
    theme_preset,
    content_layout,
    navbar_style,
    sidebar_variant,
    sidebar_collapsible,
    font,
  } = PREFERENCE_DEFAULTS;

  /**
   * Not:
   * - Extension’lar <body> üzerinde attribute ekleyebilir (cz-shortcut-listen gibi).
   * - Bu script, theme class’ı React hydration’dan önce oturtur.
   */
  const code = `
(function () {
  try {
    var d = document.documentElement;

    // defaults (server ile aynı snapshot)
    d.dataset.themePreset = ${JSON.stringify(theme_preset)};
    d.dataset.contentLayout = ${JSON.stringify(content_layout)};
    d.dataset.navbarStyle = ${JSON.stringify(navbar_style)};
    d.dataset.sidebarVariant = ${JSON.stringify(sidebar_variant)};
    d.dataset.sidebarCollapsible = ${JSON.stringify(sidebar_collapsible)};
    d.dataset.font = ${JSON.stringify(font)};

    // localStorage overrides (if exists)
    var lsMode = localStorage.getItem('theme_mode');
    var mode = (lsMode === 'dark' || lsMode === 'light') ? lsMode : ${JSON.stringify(theme_mode)};
    if (mode === 'dark') d.classList.add('dark');
    else d.classList.remove('dark');

  } catch (e) {}
})();
`;

  return (
    <Script id="theme-boot" strategy="beforeInteractive">
      {code}
    </Script>
  );
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { theme_preset, content_layout, navbar_style, sidebar_variant, sidebar_collapsible, font } =
    PREFERENCE_DEFAULTS;

  return (
    <html
      lang="de"
      // html/body hydration mismatch’lerini tolere et (extension + theme class)
      suppressHydrationWarning
      data-theme-preset={theme_preset}
      data-content-layout={content_layout}
      data-navbar-style={navbar_style}
      data-sidebar-variant={sidebar_variant}
      data-sidebar-collapsible={sidebar_collapsible}
      data-font={font}
    >
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* Primary Meta Tags */}
        <title>König Energetik - Energetische Massage Berlin | Anastasia König</title>
        <meta name="title" content="König Energetik - Energetische Massage Berlin | Anastasia König" />
        <meta name="description" content="König Energetik: Ganzheitliche energetische Massage in Berlin. Anastasia König bietet mobile Körperarbeit bei Ihnen zu Hause. Heilende Berührung mit Herz." />
        
        {/* Favicons */}
        <link rel="icon" type="image/svg+xml" href="/favicon/favicon-16.svg" sizes="16x16" />
        <link rel="icon" type="image/svg+xml" href="/favicon/favicon-32.svg" sizes="32x32" />
        
        {/* Apple Touch Icon - using SVG for now, browsers might need PNG */}
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.svg" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#FDFCFB" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://koenig-energetik.de/" />
        <meta property="og:title" content="König Energetik - Energetische Massage Berlin" />
        <meta property="og:description" content="Ganzheitliche energetische Massage in Berlin. Heilende Berührung mit Herz. Mobile Körperarbeit von Anastasia König." />
        <meta property="og:image" content="/logo/koenig-energetik-icon.svg" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://koenig-energetik.de/" />
        <meta property="twitter:title" content="König Energetik - Energetische Massage Berlin" />
        <meta property="twitter:description" content="Ganzheitliche energetische Massage in Berlin. Heilende Berührung mit Herz." />
        <meta property="twitter:image" content="/logo/koenig-energetik-icon.svg" />
      </head>
      <body className={`${fontVars} min-h-screen antialiased`} suppressHydrationWarning>
        <ThemeBootInlineScript />

        {/* Redux store gerekiyorsa kalsın */}
        <StoreProvider>
          {/* Preferences Zustand */}
          <PreferencesStoreProvider>
            <LocaleProvider>
              {children}
              <Toaster />
            </LocaleProvider>
          </PreferencesStoreProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
