'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { useUiSection } from '@/i18n/uiDb';
import { Link, localePath } from '@/i18n/routing';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const locale = typeof params?.locale === 'string' ? params.locale : 'de';
  const { ui } = useUiSection('ui_errors', locale);

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full"
      >
        <div className="flex justify-center mb-8">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20,
              delay: 0.2 
            }}
            className="p-6 bg-rose-50 text-brand-primary rounded-3xl shadow-soft"
          >
            <AlertCircle className="w-20 h-20" />
          </motion.div>
        </div>

        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl md:text-5xl font-serif font-bold text-text-primary mb-6"
        >
          {ui('ui_500_title', 'Internal Server Error')}
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg text-text-secondary mb-10 max-w-md mx-auto"
        >
          {ui('ui_500_subtitle', 'Something went wrong on our end. Please try again later.')}
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-8 py-4 bg-brand-primary text-white rounded-full font-semibold shadow-medium hover:bg-brand-hover transition-all transform hover:-translate-y-1"
          >
            <RefreshCcw className="w-5 h-5" />
            {ui('ui_500_try_again', 'Try Again')}
          </button>
          
          <Link
            href={localePath('/', locale)}
            className="flex items-center gap-2 px-8 py-4 border-2 border-border-medium text-text-primary rounded-full font-semibold hover:border-brand-primary transition-all shadow-soft"
          >
            <Home className="w-5 h-5" />
            {ui('ui_404_back_home', 'Back to Homepage')}
          </Link>
        </motion.div>

        {process.env.NODE_ENV === 'development' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-12 p-6 bg-charcoal text-sand-50 rounded-2xl text-left overflow-auto max-h-48 text-sm font-mono"
          >
            <p className="font-bold mb-2">Error Detail (Dev Only):</p>
            <p>{error.message}</p>
            {error.digest && <p className="mt-2 text-sand-400">Digest: {error.digest}</p>}
          </motion.div>
        )}
      </motion.div>

      {/* Decorative Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-rose-200/5 rounded-full blur-[120px] -z-10" />
    </div>
  );
}
