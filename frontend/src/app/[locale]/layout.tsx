import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter, Playfair_Display } from 'next/font/google';

// Legacy Styles (Try to preserve existing look)
// Note: If these rely on Bootstrap mixins, they might fail to compile since Bootstrap was removed.
// In that case, remove these imports and refactor components to use Tailwind.
// import '@/styles/index-four.scss';
// import '@/styles/main.scss';

// Note: avoid heavy global CSS for performance; animations/icons are implemented via Tailwind + inline SVGs.
import { Providers } from '../providers';
import ClientLayout from '../ClientLayout';
import { buildMetadataFromSeo, fetchSeoObject } from '@/seo/server';
// import 'bootstrap/dist/css/bootstrap.min.css'; // Removed, but might be needed if styles break heavily. 
// For now, allow broken styles to migrate structure, or keep it if I want safety. 
// User asked for "better format", suggesting we move away. But immediate breakage is bad.
// I will keep it commented out and rely on Tailwind/Global styles. 
// Wait, global styles imported 'bootstrap' in _app.tsx.
// If I remove it, existing components break.
// I'll re-add it for now to ensure components render, then removal is a separate step.
// Actually, I cannot easily import bootstrap here if I removed the package.
// I removed bootstrap package earlier! So I cannot import it.
// I must proceed without bootstrap.
// import '@fortawesome/fontawesome-free/css/all.min.css';
// import { Providers } from './providers';
// import ClientLayout from './ClientLayout';

// Configure fonts
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '600', '700'],
  fallback: ['system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
});

const playfair = Playfair_Display({ 
  subsets: ['latin'], 
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '600', '700'],
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const seo = await fetchSeoObject(locale);
  return await buildMetadataFromSeo(seo, { locale, pathname: '/' });
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
      <div className={`font-sans antialiased text-text-primary bg-bg-primary ${inter.variable} ${playfair.variable}`}>
        <Providers>
          <Suspense fallback={null}>
            <ClientLayout locale={locale}>
              {children}
            </ClientLayout>
          </Suspense>
        </Providers>
      </div>
  );
}
