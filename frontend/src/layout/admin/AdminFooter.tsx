// src/components/layout/admin/AdminFooter.tsx

'use client';

import { ChevronUp } from 'lucide-react';

export default function AdminFooter() {
  const year = new Date().getFullYear();
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="border-top bg-white">
      <div className="container-fluid py-3 d-flex flex-wrap align-items-center justify-content-center gap-2 small text-muted text-center">
        <span>© {year} konigsmassage — Admin Panel</span>
        <span className="opacity-50 d-none d-sm-inline">•</span>
        <span>v1.0.0</span>

        <button
          type="button"
          onClick={scrollToTop}
          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
          aria-label="Yukarı çık"
        >
          <ChevronUp size={14} />
          <span className="d-none d-sm-inline">Yukarı</span>
        </button>
      </div>
    </footer>
  );
}
