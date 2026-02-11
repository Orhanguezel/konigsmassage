import React, { Suspense } from 'react';
import { Inter, Playfair_Display } from 'next/font/google';

import HomePage from './[locale]/page';
import { Providers } from './providers';
import ClientLayout from './ClientLayout';

// Configure fonts
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({ 
  subsets: ['latin'], 
  variable: '--font-serif',
  display: 'swap',
});

export default function RootPage() {
  return (
    <div className={`font-sans antialiased text-text-primary bg-bg-primary ${inter.variable} ${playfair.variable}`}>
       <Providers>
         <Suspense fallback={null}>
           <ClientLayout>
             <HomePage />
           </ClientLayout>
         </Suspense>
       </Providers>
    </div>
  );
}
