// =============================================================
// FILE: src/components/layout/header/HeaderOffcanvas.tsx
// konigsmassage – Header Offcanvas (DYNAMIC LOCALES + BRAND FROM SETTINGS + OVERRIDE)
// =============================================================

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { type StaticImageData } from 'next/image';
import { useRouter } from 'next/router';

import { SiteLogo } from '@/layout/SiteLogo';

import { useResolvedLocale } from '@/i18n/locale';
import { switchLocale } from '@/i18n/switchLocale';
import { normLocaleTag } from '@/i18n/localeUtils';
import { localizePath } from '@/i18n/url';
import SocialLinks from '@/components/common/public/SocialLinks';

import { getLanguageLabel, type SupportedLocale } from '@/types/common';
import { useActiveLocales } from '@/i18n/activeLocales';

import { FiSearch, FiGlobe, FiPhone, FiMail } from 'react-icons/fi';
//import {FiLogIn, FiUserPlus } from 'react-icons/fi';

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
  logoSrc?: StaticImageData | string;
  brand?: SimpleBrand;
};

type MenuItemWithChildren = PublicMenuItemDto & {
  children?: MenuItemWithChildren[];
};

const HeaderOffcanvas: React.FC<HeaderOffcanvasProps> = ({ open, onClose, logoSrc, brand }) => {
  const router = useRouter();

  // ✅ Tek kaynak: runtime locale resolver
  const resolvedLocale = useResolvedLocale();

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

  const onLangChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = normLocaleTag(e.target.value);
    if (!next) return;

    await switchLocale(router, next as SupportedLocale, activeLocales);
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
        <li key={id} className={`offcanvas__menu-item ${depthClass}`}>
          <Link href={href} onClick={onClose}>
            {item.title || rawUrl}
          </Link>
        </li>
      );
    }

    return (
      <li
        key={id}
        className={`offcanvas__menu-item has-submenu ${depthClass} ${isOpen ? 'is-open' : ''}`}
      >
        <button
          type="button"
          className="submenu-toggle"
          onClick={() => toggleSubmenu(id)}
          aria-expanded={isOpen}
          aria-controls={submenuId}
        >
          <span>{item.title || rawUrl}</span>
          <span className="caret" aria-hidden="true" />
        </button>

        <ul id={submenuId} className={`submenu ${isOpen ? 'open' : ''}`}>
          {item.children!.map((child) => renderMobileMenuItem(child, depth + 1))}
        </ul>
      </li>
    );
  };

  // const loginHref = localizePath(resolvedLocale, '/login');
  // const registerHref = localizePath(resolvedLocale, '/register');

  return (
    <>
      <div className={(open ? ' info-open' : ' ') + ' offcanvas__info'}>
        <div className="offcanvas__wrapper">
          <div className="offcanvas__content">
            <div className="offcanvas__top mb-40 d-flex justify-content-between align-items-center">
              <SiteLogo
                alt={effectiveBrand.name}
                overrideSrc={logoSrc ?? effectiveBrand.logo?.url}
              />

              <div className="offcanvas__close">
                <button
                  type="button"
                  className="hamburger cross hamburger--close"
                  aria-label={ui('ui_header_close', 'Close')}
                  aria-expanded={open}
                  onClick={onClose}
                >
                  <span className="line" />
                  <span className="line" />
                  <span className="line" />
                </button>
              </div>
            </div>

            {/* Language */}
            <div className="d-flex flex-column gap-2 mb-25">
              <label
                htmlFor="lang-any"
                className="offcanvas__lang-label d-flex align-items-center gap-2"
              >
                <FiGlobe /> <span>{ui('ui_header_language', 'Language')}</span>
              </label>

              <select
                id="lang-any"
                value={resolvedLocale}
                onChange={onLangChange}
                className="form-select offcanvas__lang-select"
                disabled={localesLoading}
              >
                {activeLocales.map((loc) => (
                  <option key={loc} value={loc}>
                    {getLanguageLabel(loc, String(loc).toUpperCase())}
                  </option>
                ))}
              </select>

              {/*
              <div className="d-flex align-items-center gap-2">
                <Link
                  href={loginHref}
                  className="border__btn d-inline-flex align-items-center gap-1"
                  onClick={onClose}
                >
                  <FiLogIn /> {ui('ui_header_auth', 'Login')}
                </Link>

                <Link
                  href={registerHref}
                  className="solid__btn d-inline-flex align-items-center gap-1"
                  onClick={onClose}
                >
                  <FiUserPlus /> {ui('ui_header_register', 'Register')}
                </Link>
              </div>
              */}
            </div>

            {/* Search */}
            <div className="offcanvas__search mb-25">
              <form action="/">
                <input
                  type="text"
                  placeholder={ui('ui_header_search_placeholder', 'Search...')}
                  required
                />
                <button type="submit" aria-label={ui('ui_header_search', 'Search')}>
                  <FiSearch />
                </button>
              </form>
            </div>

            {/* Menu */}
            <div className="offcanvas__menu mobile-menu fix mb-40 mean-container">
              <div className="mean-bar d-block">
                <nav className="mean-nav">
                  <ul>
                    {headerMenuItems.map((it) => renderMobileMenuItem(it, 0))}

                    {!headerMenuItems.length && !isMenuLoading && (
                      <li>
                        <span className="text-muted small">
                          {ui('menu_empty', '(Menü tanımlı değil)')}
                        </span>
                      </li>
                    )}

                    {isMenuLoading && (
                      <li>
                        <span className="text-muted small">
                          {ui('menu_loading', '(Menü yükleniyor...)')}
                        </span>
                      </li>
                    )}
                  </ul>
                </nav>
              </div>
            </div>

            {/* Contact */}
            <div className="offcanvas__contact mt-30 mb-20">
              <h4>{ui('ui_header_contact_info', 'Contact Info')}</h4>
              <ul>
                <li className="d-flex align-items-center">
                  <div className="offcanvas__contact-icon mr-15">
                    <FiGlobe />
                  </div>
                  <div className="offcanvas__contact-text">
                    <Link target="_blank" href={effectiveBrand.website || '/'}>
                      {webHost}
                    </Link>
                  </div>
                </li>

                <li className="d-flex align-items-center">
                  <div className="offcanvas__contact-icon mr-15">
                    <FiPhone />
                  </div>
                  <div className="offcanvas__contact-text">
                    <Link
                      href={
                        safePhone ? `tel:${safePhone}` : localizePath(resolvedLocale, '/contact')
                      }
                      aria-label={ui('ui_header_call', 'Call')}
                      onClick={safePhone ? undefined : onClose}
                    >
                      {effectiveBrand.phone || '—'}
                    </Link>
                  </div>
                </li>

                <li className="d-flex align-items-center">
                  <div className="offcanvas__contact-icon mr-15">
                    <FiMail />
                  </div>
                  <div className="offcanvas__contact-text">
                    <Link
                      href={`mailto:${effectiveBrand.email}`}
                      aria-label={ui('ui_header_email', 'Email')}
                    >
                      <span>{effectiveBrand.email}</span>
                    </Link>
                  </div>
                </li>
              </ul>
            </div>

            <div className="offcanvas__social">
              <SocialLinks socials={effectiveBrand.socials} size="md" onClickItem={onClose} />
            </div>
          </div>
        </div>
      </div>

      <div className={(open ? ' overlay-open' : ' ') + ' offcanvas__overlay'} onClick={onClose} />
      <div className="offcanvas__overlay-white" />
    </>
  );
};

export default HeaderOffcanvas;
