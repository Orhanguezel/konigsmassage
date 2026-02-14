// src/components/layout/header/HeaderClient.tsx
'use client';

import React, { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import HeaderOffcanvas from './HeaderOffcanvas';
import { SiteLogo } from '@/layout/SiteLogo';

import { useListMenuItemsQuery, useGetSiteSettingByKeyQuery } from '@/integrations/rtk/hooks';
import type { PublicMenuItemDto } from '@/integrations/types';

import { localizePath } from '@/i18n/url';
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';

type SimpleBrand = {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  socials?: Record<string, string>;
};

type Props = { brand?: SimpleBrand; locale?: string };

type MenuItemWithChildren = PublicMenuItemDto & {
  children?: MenuItemWithChildren[];
};

const isExternalHref = (href: string) =>
  /^https?:\/\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href) || /^#/i.test(href);

const HeaderClient: React.FC<Props> = ({ brand, locale: localeProp }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [overlayDark, setOverlayDark] = useState(false);
  const pathname = usePathname();

  // Hooks her zaman aynı sırada çağrılmalı!
  const locale = useLocaleShort(localeProp);
  const { ui, raw: uiHeaderJson } = useUiSection('ui_header', locale);

  const menuEmptyLabel =
    (typeof (uiHeaderJson as any)?.menu_empty === 'string' &&
      String((uiHeaderJson as any).menu_empty).trim()) ||
    '(Menü tanımlı değil)';

  const menuLoadingLabel =
    (typeof (uiHeaderJson as any)?.menu_loading === 'string' &&
      String((uiHeaderJson as any).menu_loading).trim()) ||
    '(Menü yükleniyor...)';

  const { data: contactInfoSetting } = useGetSiteSettingByKeyQuery({
    key: 'contact_info',
    locale,
  });

  const { data: socialsSetting } = useGetSiteSettingByKeyQuery({
    key: 'socials',
    locale,
  });

  const { data: companyBrandSetting } = useGetSiteSettingByKeyQuery({
    key: 'company_brand',
    locale,
  });

  const brandFromSettings = useMemo(() => {
    const contact = (contactInfoSetting?.value ?? {}) as any;
    const socials = (socialsSetting?.value ?? {}) as Record<string, string>;
    const brandVal = (companyBrandSetting?.value ?? {}) as any;

    const name = (brandVal?.name as string) || (contact?.companyName as string) || 'KÖNIGS MASSAGE';

    const website =
      (brandVal?.website as string) ||
      (contact?.website as string) ||
      'https://www.koenigsmassage.com';

    const phones = Array.isArray(contact?.phones) ? contact.phones : [];
    const phone =
      (phones[0] as string | undefined) ||
      (contact?.whatsappNumber as string | undefined) ||
      (brandVal?.phone as string | undefined) ||
      '';

    const email =
      (contact?.email as string) || (brandVal?.email as string) || 'info@koenigsmassage.com';

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

  const resolvedBrand = useMemo(
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

  const { data: menuData, isLoading: isMenuLoading } = useListMenuItemsQuery({
    location: 'header',
    is_active: true,
    locale,
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
        .sort((a, b) => {
          const ao = (a as any)?.order_num ?? 0;
          const bo = (b as any)?.order_num ?? 0;
          return ao - bo;
        })
        .map((it) => ({
          ...it,
          children: it.children ? sortRecursive(it.children as MenuItemWithChildren[]) : undefined,
        }));

    return sortRecursive(list);
  }, [menuData]);

  // ✅ sticky threshold = header height + buffer (RAF throttled)
  useEffect(() => {
    let raf = 0;

    const computeThreshold = () => {
      const el = document.getElementById('header-sticky');
      const h = el?.getBoundingClientRect().height ?? 90;
      return Math.max(80, Math.round(h + 24));
    };

    let threshold = 100;

    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const isScrolled = window.scrollY > threshold;
        setScrolled(isScrolled);
      });
    };

    const recalc = () => {
      threshold = computeThreshold();
      onScroll();
    };

    recalc();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', recalc);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', recalc);
    };
  }, [pathname]);

  // ✅ Detect if header is on top of a "dark overlay" section without forced reflow on every scroll.
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('[data-header-overlay="true"]');
    if (!el) {
      setOverlayDark(false);
      return;
    }

    const headerEl = document.getElementById('header-sticky');
    const headerH = Math.round(headerEl?.getBoundingClientRect().height ?? 96);

    const obs = new IntersectionObserver(
      (entries) => {
        const isOnDark = entries.some((e) => e.isIntersecting);
        setOverlayDark(isOnDark);
      },
      { root: null, threshold: 0, rootMargin: `-${headerH}px 0px 0px 0px` },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [pathname]);

  const renderDesktopMenuItem = (item: MenuItemWithChildren) => {
    const rawUrl = (item.url || (item as any).href || '#') as string;
    const label = (item.title || rawUrl) as string;

    const hasChildren = !!item.children && item.children.length > 0;
    const onDark = !scrolled && overlayDark;
    const topLinkClass = onDark
      ? 'block py-4 px-2 text-sm font-bold uppercase tracking-wide text-white/90 hover:text-accent-gold transition-colors'
      : 'block py-4 px-2 text-sm font-bold uppercase tracking-wide hover:text-primary transition-colors';
    const topLinkClassFlex = onDark
      ? 'flex py-4 px-2 text-sm font-bold uppercase tracking-wide text-white/90 hover:text-accent-gold transition-colors items-center gap-1'
      : 'flex py-4 px-2 text-sm font-bold uppercase tracking-wide hover:text-primary transition-colors items-center gap-1';

    // External link support
    if (isExternalHref(rawUrl)) {
      const external = /^https?:\/\//i.test(rawUrl);
      if (!hasChildren) {
        return (
          <li key={String(item.id ?? rawUrl)}>
            <a
              href={rawUrl}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className={topLinkClass}
            >
              {label}
            </a>
          </li>
        );
      }
      // external + children pek mantıklı değil; parent'ı link yapmadan label gösterelim
      return (
        <li key={String(item.id ?? rawUrl)} className="group relative">
          <span className="flex py-4 px-2 text-sm font-bold uppercase tracking-wide items-center gap-1 cursor-default">
            {label}
          </span>
          <ul className="absolute top-full left-0 min-w-56 bg-white text-slate-800 shadow-xl rounded-b-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 py-2 border-t-2 border-primary transform origin-top scale-95 group-hover:scale-100">
            {item.children!.map((child) => {
              const childRawUrl = (child.url || (child as any).href || '#') as string;
              const childLabel = (child.title || childRawUrl) as string;

              const childExternal = /^https?:\/\//i.test(childRawUrl);
              return (
                <li key={String(child.id ?? childRawUrl)}>
                  <a
                    href={childRawUrl}
                    target={childExternal ? '_blank' : undefined}
                    rel={childExternal ? 'noopener noreferrer' : undefined}
                    className="block px-6 py-2.5 text-sm hover:bg-pink-50 hover:text-primary transition-colors border-b border-gray-50 last:border-0"
                  >
                    {childLabel}
                  </a>
                </li>
              );
            })}
          </ul>
        </li>
      );
    }

    // Internal link
    const href = localizePath(locale, rawUrl);

    if (!hasChildren) {
      return (
        <li key={String(item.id ?? rawUrl)}>
          <Link
            href={href}
            className={topLinkClass}
          >
            {label}
          </Link>
        </li>
      );
    }

    return (
      <li key={String(item.id ?? rawUrl)} className="group relative">
        {/* ✅ FIX: block + flex conflict kaldırıldı */}
        <Link
          href={href}
          className={topLinkClassFlex}
        >
          {label}
        </Link>

        <ul className="absolute top-full left-0 min-w-56 bg-white text-slate-800 shadow-xl rounded-b-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 py-2 border-t-2 border-primary transform origin-top scale-95 group-hover:scale-100">
          {item.children!.map((child) => {
            const childRawUrl = (child.url || (child as any).href || '#') as string;
            const childHref = isExternalHref(childRawUrl)
              ? childRawUrl
              : localizePath(locale, childRawUrl);
            const childLabel = (child.title || childRawUrl) as string;

            if (isExternalHref(childRawUrl)) {
              const external = /^https?:\/\//i.test(childRawUrl);
              return (
                <li key={String(child.id ?? childRawUrl)}>
                  <a
                    href={childHref}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    className="block px-6 py-2.5 text-sm hover:bg-pink-50 hover:text-primary transition-colors border-b border-gray-50 last:border-0"
                  >
                    {childLabel}
                  </a>
                </li>
              );
            }

            return (
              <li key={String(child.id ?? childRawUrl)}>
                <Link
                  href={childHref}
                  className="block px-6 py-2.5 text-sm hover:bg-pink-50 hover:text-primary transition-colors border-b border-gray-50 last:border-0"
                >
                  {childLabel}
                </Link>
              </li>
            );
          })}
        </ul>
      </li>
    );
  };

  const homeHref = localizePath(locale, '/');

  return (
    <Fragment>
      <HeaderOffcanvas open={open} onClose={() => setOpen(false)} brand={resolvedBrand} locale={locale} />

      <header>
        <div
          id="header-sticky"
          className={`w-full z-99 transition-all duration-300 flex items-center ${
            scrolled
              ? 'fixed top-0 left-0 bg-white/95 backdrop-blur-md shadow-lg text-slate-800 h-[90px]'
              : !scrolled && overlayDark
              ? 'absolute top-0 left-0 bg-transparent text-white h-[120px]'
              : 'absolute top-0 left-0 bg-white/95 backdrop-blur-md shadow-sm text-slate-800 h-[120px]'
          }`}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="w-auto shrink-0 flex items-center">
                <div className="flex">
                  <Link href={homeHref} aria-label={resolvedBrand.name}>
                    <SiteLogo
                      variant={!scrolled && overlayDark ? 'light' : 'default'}
                      alt={resolvedBrand.name}
                      wrapperClassName="w-64 sm:w-72 md:w-80"
                      className="w-auto max-w-none"
                    />
                  </Link>
                </div>
              </div>

              {/* Desktop menu */}
              <div className="hidden lg:flex flex-1 justify-center">
                <div className="flex justify-center w-full">
                  <div className="hidden lg:block">
                    <nav id="mobile-menu">
                      <ul className="flex gap-6 xl:gap-8 items-center list-none m-0 p-0">
                        {headerMenuItems.map(renderDesktopMenuItem)}

                        {/* menü boşken placeholder gösterme — SEO'da hata mesajı olarak indeksleniyor */}

                        {isMenuLoading && (
                          <li>
                            <span className="opacity-70 text-sm ps-2">{menuLoadingLabel}</span>
                          </li>
                        )}
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="w-auto shrink-0">
                <div className="flex items-center justify-end gap-4">
                  <div className="hidden lg:inline-flex">
                    <button
                      type="button"
                      className={`relative z-10 w-10 h-6 flex flex-col justify-between cursor-pointer focus:outline-none transition-transform duration-300 ${
                        open ? 'rotate-90' : ''
                      }`}
                      aria-label={ui('ui_header_open_menu', 'Open Menu')}
                      aria-expanded={open}
                      onClick={() => setOpen(true)}
                    >
                      <span
                        className={`block w-full h-0.5 bg-current transition-all ${
                          open ? 'translate-y-2.5 rotate-45' : ''
                        }`}
                      />
                      <span
                        className={`block w-3/4 ml-auto h-0.5 bg-current transition-all ${
                          open ? 'opacity-0' : ''
                        }`}
                      />
                      <span
                        className={`block w-full h-0.5 bg-current transition-all ${
                          open ? '-translate-y-3 -rotate-45' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="lg:hidden">
                    <button
                      type="button"
                      className={`relative z-10 w-8 h-5 flex flex-col justify-between cursor-pointer focus:outline-none ${
                        open ? 'text-primary' : 'text-current'
                      }`}
                      aria-label={ui('ui_header_open_sidebar', 'Open Sidebar')}
                      aria-expanded={open}
                      onClick={() => setOpen(true)}
                    >
                      <span className="block w-full h-0.5 bg-current" />
                      <span className="block w-full h-0.5 bg-current" />
                      <span className="block w-full h-0.5 bg-current" />
                    </button>
                  </div>
                </div>
              </div>
              {/* /Right */}
            </div>
          </div>
        </div>
      </header>
    </Fragment>
  );
};

export default HeaderClient;
