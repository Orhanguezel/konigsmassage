'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Timer } from 'lucide-react';

type Props = {
  locale: string;
  ui: (key: string, fb: string) => string;
  homePath: string;
};

export function NotFoundContent({ locale, ui, homePath }: Props) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(homePath);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [homePath, router]);

  const getRedirectText = () => {
    const raw = ui('ui_404_redirect_info', 'You will be redirected to the homepage in {seconds} seconds.');
    return raw.replace('{seconds}', countdown.toString());
  };

  const getNoPageText = () => {
    switch (locale) {
      case 'tr': return 'Aradığınız sayfa bulunamadı veya artık mevcut değil.';
      case 'de': return 'Die von Ihnen gesuchte Seite wurde nicht gefunden oder existiert nicht mehr.';
      default: return ui('ui_404_subtitle', "The page you are looking for might have been moved, deleted, or doesn't exist.");
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[75vh] px-4 text-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full z-10"
      >
        <div className="relative mb-6 overflow-hidden max-w-full">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="text-8xl sm:text-9xl md:text-[14rem] font-serif font-bold text-rose-100/40 select-none leading-none"
          >
            404
          </motion.h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl font-serif font-bold text-text-primary px-4"
            >
              {ui('ui_404_title', 'Page Not Found')}
            </motion.h2>
          </div>
        </div>

        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.4 }}
           className="space-y-4 mb-10"
        >
          <p className="text-xl md:text-2xl text-text-secondary font-medium">
            {getNoPageText()}
          </p>
          
          <div className="flex items-center justify-center gap-2 text-rose-600 font-medium bg-rose-50 w-fit mx-auto px-4 py-2 rounded-full border border-rose-100">
            <Timer className="w-5 h-5 animate-pulse" />
            <span>{getRedirectText()}</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => router.push(homePath)}
            className="flex items-center gap-2 px-10 py-4 bg-brand-primary text-white rounded-full font-bold shadow-medium hover:bg-brand-hover transition-all transform hover:-translate-y-1 active:scale-95"
          >
            <Home className="w-5 h-5" />
            {ui('ui_404_back_home', 'Back to Homepage')}
          </button>
          
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-10 py-4 border-2 border-border-medium text-text-primary rounded-full font-bold hover:border-brand-primary hover:bg-white transition-all whitespace-nowrap active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            {locale === 'tr' ? 'Geri Dön' : (locale === 'de' ? 'Zurück' : 'Go Back')}
          </button>
        </motion.div>
      </motion.div>

      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
          x: [0, 50, 0],
          y: [0, -50, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-200/20 rounded-full blur-[120px] -z-10" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1],
          x: [0, -30, 0],
          y: [0, 40, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 2 }}
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gold-200/10 rounded-full blur-[140px] -z-10" 
      />
    </div>
  );
}
