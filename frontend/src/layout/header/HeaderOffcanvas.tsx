// =============================================================
// FILE: src/components/layout/header/HeaderOffcanvas.tsx
// konigsmassage – Header Offcanvas (DYNAMIC LOCALES + BRAND FROM SETTINGS + OVERRIDE)
// =============================================================

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import { SiteLogo } from '@/layout/SiteLogo';

import { useLocaleShort } from '@/i18n/useLocaleShort';
import { switchLocale } from '@/i18n/switchLocale';
import { normLocaleTag } from '@/i18n/localeUtils';
import { localizePath } from '@/i18n/url';
import SocialLinks from '@/components/common/public/SocialLinks';

import { getLanguageLabel, type SupportedLocale } from '@/types/common';
import { useActiveLocales } from '@/i18n/activeLocales';

import {
  IconGlobe,
  IconLogIn,
  IconMail,
  IconPhone,
  IconSearch,
  IconUserPlus,
} from '@/components/ui/icons';

import { useListMenuItemsQuery, useGetSiteSettingByKeyQuery } from '@/integrations/rtk/hooks';
import type { PublicMenuItemDto } from '@/integrations/types';
import { useUiSection } from '@/i18n/uiDb';

export type SimpleBrand = {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  socials?: Record<string, string>;
};

export type HeaderOffcanvasProps = {
  open: boolean;
  onClose: () => void;
  brand?: SimpleBrand;
  locale?: string;
};

type MenuItemWithChildren = PublicMenuItemDto & {
  children?: MenuItemWithChildren[];
};

const HeaderOffcanvas: React.FC<HeaderOffcanvasProps> = ({ open, onClose, brand, locale: localeProp }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const asPath = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

  // Hooks her zaman aynı sırada çağrılmalı!
  // useLocaleShort returns short locale codes (tr, en, de) expected by backend
  // Path prefix is the source of truth; prop is only a hint.
  const resolvedLocale = useLocaleShort(localeProp);

  // ✅ Dinamik locale listesi (DB meta endpoint)
  const { locales: activeLocales, isLoading: localesLoading } = useActiveLocales();

  // ✅ UI translations (header)
  const { ui } = useUiSection('ui_header', resolvedLocale);

  // Brand settings (locale-aware)
  const { data: contactInfoSetting } = useGetSiteSettingByKeyQuery({
    key: 'contact_info',
    locale: resolvedLocale,
  });
  const { data: socialsSetting } = useGetSiteSettingByKeyQuery({
    key: 'socials',
    locale: resolvedLocale,
  });
  const { data: companyBrandSetting } = useGetSiteSettingByKeyQuery({
    key: 'company_brand',
    locale: resolvedLocale,
  });

  const brandFromSettings = useMemo(() => {
    const contact = (contactInfoSetting?.value ?? {}) as any;
    const socials = (socialsSetting?.value ?? {}) as Record<string, string>;
    const brandVal = (companyBrandSetting?.value ?? {}) as any;

    const name = (brandVal?.name as string) || (contact?.companyName as string) || 'ENSOTEK';

    const website =
      (brandVal?.website as string) ||
      (contact?.website as string) ||
      'https://www.koenigsmassage.com';

    const phones = Array.isArray(contact?.phones) ? contact.phones : [];
    const phone =
      (phones[0] as string | undefined) ||
      (contact?.whatsappNumber as string | undefined) ||
      (brandVal?.phone as string | undefined) ||
      '+90 212 000 00 00';

    const email =
      (contact?.email as string) || (brandVal?.email as string) || 'info@konigsmassage.com';

    const mergedSocials: Record<string, string> = {
      ...(brandVal?.socials as Record<string, string> | undefined),
      ...(socials ?? {}),
    };

    const logo = (brandVal?.logo ||
      (Array.isArray(brandVal?.images) ? brandVal.images[0] : null) ||
      {}) as { url?: string; width?: number; height?: number };

    return {
      name,
      website,
      phone,
      email,
      socials: mergedSocials,
      logo,
    };
  }, [contactInfoSetting?.value, socialsSetting?.value, companyBrandSetting?.value]);

  // ✅ Header’dan gelen brand ile DB brand’ini birleştir
  const effectiveBrand = useMemo(
    () => ({
      ...brandFromSettings,
      ...(brand ?? {}),
      socials: {
        ...(brandFromSettings.socials ?? {}),
        ...(brand?.socials ?? {}),
      },
    }),
    [brandFromSettings, brand],
  );

  const webHost = useMemo(
    () => (effectiveBrand.website || 'https://www.koenigsmassage.com').replace(/^https?:\/\//, ''),
    [effectiveBrand.website],
  );

  const safePhone = (effectiveBrand.phone || '').replace(/\s+/g, '');
  const dialogTitleId = 'header-offcanvas-title';

  const onLangChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = normLocaleTag(e.target.value);
    if (!next) return;

    await switchLocale(router, asPath, next as SupportedLocale, activeLocales);
    onClose();
  };

  // Menu (locale-aware)
  const { data: menuData, isLoading: isMenuLoading } = useListMenuItemsQuery({
    location: 'header',
    is_active: true,
    locale: resolvedLocale,
    nested: true,
  });

  const headerMenuItems: MenuItemWithChildren[] = useMemo(() => {
    const raw = menuData as any;
    const list: MenuItemWithChildren[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.items)
      ? raw.items
      : [];

    const sortRecursive = (items: MenuItemWithChildren[]): MenuItemWithChildren[] =>
      items
        .slice()
        .sort((a, b) => ((a as any)?.order_num ?? 0) - ((b as any)?.order_num ?? 0))
        .map((it) => ({
          ...it,
          children: it.children ? sortRecursive(it.children as MenuItemWithChildren[]) : undefined,
        }));

    return sortRecursive(list);
  }, [menuData]);

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) setOpenSubmenus({});
  }, [open]);

  const toggleSubmenu = (id: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const renderMobileMenuItem = (item: MenuItemWithChildren, depth = 0) => {
    const rawUrl = item.url || (item as any).href || '#';
    const href = localizePath(resolvedLocale, rawUrl);

    const hasChildren = !!item.children && item.children.length > 0;
    const id = String(item.id ?? rawUrl ?? Math.random());
    const isOpen = !!openSubmenus[id];
    const submenuId = `submenu:${id}`;

    const depthClass = `depth-${depth}`;

    if (!hasChildren) {
      return (
        <li key={id} className={`border-b border-gray-100 last:border-0 ${depthClass}`}>
          <Link href={href} onClick={onClose} className="block py-3 text-slate-700 hover:text-primary font-medium transition-colors">
            {item.title || rawUrl}
          </Link>
        </li>
      );
    }

    return (
      <li
        key={id}
        className={`border-b border-gray-100 last:border-0 ${depthClass}`}
      >
        <button
          type="button"
          className={`flex items-center justify-between w-full py-3 text-left font-medium transition-colors ${isOpen ? 'text-primary' : 'text-slate-800 hover:text-primary'}`}
          onClick={() => toggleSubmenu(id)}
          aria-expanded={isOpen}
          aria-controls={submenuId}
        >
          <span>{item.title || rawUrl}</span>
          <span className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </span>
        </button>

        <ul id={submenuId} className={`${isOpen ? 'block' : 'hidden'} pl-4 border-l border-gray-100 mb-2`}>
          {item.children!.map((child) => renderMobileMenuItem(child, depth + 1))}
        </ul>
      </li>
    );
  };

  const loginHref = localizePath(resolvedLocale, '/login');
  const registerHref = localizePath(resolvedLocale, '/register');

  return (
    <>
      {/* Overlay (always below offcanvas) */}
      <div 
        className={`fixed inset-0 bg-black/60 z-10000 transition-opacity duration-300 ${open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`} 
        onClick={onClose} 
        aria-hidden="true"
      />
      {/* Offcanvas (always above overlay) */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-10001 shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}
        tabIndex={-1}
        aria-modal="true"
        role="dialog"
        aria-labelledby={dialogTitleId}
      >
          <div className="h-full overflow-y-auto p-6 md:p-8">
          <div className="flex flex-col h-full">
            <p id={dialogTitleId} className="sr-only">
              {ui('ui_header_open_menu', 'Menu')}
            </p>
            <div className="flex justify-between items-center mb-8">
              <SiteLogo
                alt={effectiveBrand.name}
              />

              <div className="ml-4">
                <button
                  type="button"
                  className="w-8 h-8 flex flex-col justify-center items-center gap-1.5 group"
                  aria-label={ui('ui_header_close', 'Close')}
                  aria-expanded={open}
                  onClick={onClose}
                >
                  <span className="w-6 h-0.5 bg-slate-800 rotate-45 translate-y-2 transition-transform"></span>
                  <span className="w-6 h-0.5 bg-slate-800 opacity-0 transition-opacity"></span>
                  <span className="w-6 h-0.5 bg-slate-800 -rotate-45 -translate-y-2 transition-transform"></span>
                </button>
              </div>
            </div>

            {/* Language */}
            <div className="flex flex-col gap-2 mb-8">
              <label
                htmlFor="lang-any"
                className="flex items-center gap-2 text-sm font-bold text-slate-800"
              >
                <IconGlobe className="text-primary" size={18} /> <span>{ui('ui_header_language', 'Language')}</span>
              </label>

              <div className="relative">
                <select
                  id="lang-any"
                  value={resolvedLocale}
                  onChange={onLangChange}
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                  disabled={localesLoading}
                >
                  {activeLocales.map((loc) => (
                    <option key={loc} value={loc}>
                      {getLanguageLabel(loc, String(loc).toUpperCase())}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="mb-8">
              <form action="/" className="relative">
                <input
                  type="text"
                  placeholder={ui('ui_header_search_placeholder', 'Search...')}
                  required
                  aria-label={ui('ui_header_search', 'Search')}
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:bg-white transition-colors"
                />
                <button type="submit" aria-label={ui('ui_header_search', 'Search')} className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
                  <IconSearch size={18} />
                </button>
              </form>
            </div>

            {/* Menu */}
            <div className="mb-8 flex-1">
              <nav>
                <ul className="flex flex-col">
                  {headerMenuItems.map((it) => renderMobileMenuItem(it, 0))}

                  {/* menü boşken placeholder gösterme — SEO'da hata mesajı olarak indeksleniyor */}

                  {isMenuLoading && (
                    <li>
                      <span className="text-slate-400 text-sm py-2 block">
                        {ui('menu_loading', '(Menü yükleniyor...)')}
                      </span>
                    </li>
                  )}
                </ul>
              </nav>
            </div>

            {/* Auth Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <Link 
                href={loginHref} 
                className="flex items-center justify-center gap-2 px-4 py-3 border border-sand-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-sand-50 hover:text-brand-primary transition-all"
                onClick={onClose}
              >
                <IconLogIn className="text-lg" size={18} />
                <span>{ui('ui_header_login', 'Login')}</span>
              </Link>
              <Link 
                href={registerHref} 
                className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-white rounded-lg text-sm font-bold hover:bg-brand-dark transition-all shadow-sm"
                onClick={onClose}
              >
                <IconUserPlus className="text-lg" size={18} />
                <span>{ui('ui_header_register', 'Register')}</span>
              </Link>
            </div>

            {/* Contact */}
            <div className="mt-auto pt-6 border-t border-gray-100">
              <p className="text-lg font-serif font-bold mb-4 text-slate-900">
                {ui('ui_header_contact_info', 'Contact Info')}
              </p>
              <ul className="space-y-4">
                <li className="flex items-center group">
                  <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-primary mr-4 group-hover:bg-primary group-hover:text-white transition-colors">
                    <IconGlobe size={18} />
                  </div>
                  <div className="text-sm font-medium text-slate-600">
                    <Link target="_blank" href={effectiveBrand.website || '/'} className="hover:text-primary transition-colors">
                      {webHost}
                    </Link>
                  </div>
                </li>

                <li className="flex items-center group">
                  <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-primary mr-4 group-hover:bg-primary group-hover:text-white transition-colors">
                    <IconPhone size={18} />
                  </div>
                  <div className="text-sm font-medium text-slate-600">
                    <Link
                      href={
                        safePhone ? `tel:${safePhone}` : localizePath(resolvedLocale, '/contact')
                      }
                      aria-label={`${ui('ui_header_call', 'Call')}: ${effectiveBrand.phone || ''}`}
                      onClick={safePhone ? undefined : onClose}
                      className="hover:text-primary transition-colors"
                    >
                      {effectiveBrand.phone || '—'}
                    </Link>
                  </div>
                </li>

                <li className="flex items-center group">
                  <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-primary mr-4 group-hover:bg-primary group-hover:text-white transition-colors">
                    <IconMail size={18} />
                  </div>
                  <div className="text-sm font-medium text-slate-600">
                    <Link
                      href={`mailto:${effectiveBrand.email}`}
                      aria-label={`${ui('ui_header_email', 'Email')}: ${effectiveBrand.email || ''}`}
                      className="hover:text-primary transition-colors"
                    >
                      <span>{effectiveBrand.email}</span>
                    </Link>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <SocialLinks socials={effectiveBrand.socials} size="md" onClickItem={onClose} />
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 z-9999 transition-opacity duration-300 ${open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`} 
        onClick={onClose} 
        aria-hidden="true"
      />
    </>
  );
};

export default HeaderOffcanvas;
