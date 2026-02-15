// =============================================================
// FILE: src/components/containers/footer/FooterTwo.tsx
// konigsmassage – Alternative Footer (Template v2)
// - Üst: 3 adet footer_sections + menu_items
// - Sağ sütun: SiteLogo + contact_info + socials
// - Alt: dinamik copyright (ui_footer + company_brand)
// - Tüm stil class'ları orijinal template ile aynı
// =============================================================

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

import { SiteLogo } from '@/layout/SiteLogo';
import SocialLinks from '@/components/common/public/SocialLinks';

import {
  useGetSiteSettingByKeyQuery,
  useListFooterSectionsQuery,
  useListMenuItemsQuery,
} from '@/integrations/rtk/hooks';

import type { FooterSectionDto, PublicMenuItemDto } from '@/integrations/shared';

import { useLocaleShort } from '@/i18n/useLocaleShort';
import { localizePath } from '@/i18n/url';
import { useUiSection } from '@/i18n/uiDb';

const isExternalHref = (href: string) =>
  /^https?:\/\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href) || /^#/i.test(href);

type FooterProps = { locale?: string };

const Footer: React.FC<FooterProps> = ({ locale: localeProp }) => {
  // Hooks her zaman aynı sırada çağrılmalı!
  const fallbackLocale = useLocaleShort();
  const locale = localeProp || fallbackLocale;
  const { ui } = useUiSection('ui_footer', locale);

  // --------- site_settings: brand + contact + socials ----------
  const { data: contactInfoSetting } = useGetSiteSettingByKeyQuery({
    key: 'contact_info',
    locale,
  });

  const { data: companyBrandSetting } = useGetSiteSettingByKeyQuery({
    key: 'company_brand',
    locale,
  });

  const { data: socialsSetting } = useGetSiteSettingByKeyQuery({
    key: 'socials',
    locale,
  });

  const { brandName, phone, email, website, addrLines, socials } = useMemo(() => {
    const contact = (contactInfoSetting?.value ?? {}) as any;
    const brandVal = (companyBrandSetting?.value ?? {}) as any;
    const socialsVal = (socialsSetting?.value ?? {}) as Record<string, string>;

    const name = (brandVal.name as string) || (contact.companyName as string) || 'konigsmassage';

    const site =
      (brandVal.website as string) || (contact.website as string) || 'https://www.konigsmassage.de';

    const phoneVal =
      (brandVal.phone as string | undefined) ||
      (Array.isArray(contact.phones) ? (contact.phones[0] as string | undefined) : undefined) ||
      (contact.whatsappNumber as string | undefined) ||
      '';

    const emailVal =
      (brandVal.email as string | undefined) || (contact.email as string | undefined) || '';

    const mergedSocials: Record<string, string> = {
      ...(brandVal.socials as Record<string, string> | undefined),
      ...socialsVal,
    };

    const addrLinesComputed: string[] = [];
    if (contact.address) addrLinesComputed.push(String(contact.address));
    if (contact.addressSecondary) addrLinesComputed.push(String(contact.addressSecondary));

    return {
      brandName: name,
      phone: (phoneVal || '').trim(),
      email: (emailVal || '').trim(),
      website: (site || '').trim(),
      addrLines: addrLinesComputed,
      socials: mergedSocials,
    };
  }, [contactInfoSetting?.value, companyBrandSetting?.value, socialsSetting?.value]);

  // --------- footer_sections ----------
  const { data: footerSections } = useListFooterSectionsQuery({
    is_active: true,
    order: 'display_order.asc',
    locale,
  });

  const sections: FooterSectionDto[] = useMemo(() => {
    // eslint-disable-next-line no-console
    return (footerSections ?? [])
      .slice()
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)) as FooterSectionDto[];
  }, [footerSections]);

  // Bu template’te ilk 3 section link kolonları için kullanılıyor
  const section1 = sections[0];
  const section2 = sections[1];
  const section3 = sections[2];

  // --------- footer menu items ----------
  const { data: footerMenuData } = useListMenuItemsQuery({
    location: 'footer',
    is_active: true,
    locale,
  });

  const footerMenuItems: PublicMenuItemDto[] = useMemo(
    () => footerMenuData?.items ?? [],
    [footerMenuData],
  );

  const itemsBySectionId = useMemo(() => {
    const m = new Map<string, PublicMenuItemDto[]>();

    for (const item of footerMenuItems) {
      const sid = ((item as any).section_id ?? (item as any).sectionId) as string | undefined;
      if (!sid) continue;
      const arr = m.get(sid) ?? [];
      arr.push(item);
      m.set(sid, arr);
    }

    for (const [sid, arr] of m) {
      arr.sort((a: any, b: any) => (a.order_num ?? 0) - (b.order_num ?? 0));
      m.set(sid, arr);
    }

    return m;
  }, [footerMenuItems]);

  const renderMenuItem = (item: PublicMenuItemDto) => {
    const rawUrl = (item.url || (item as any).href || '#') as string;

    if (isExternalHref(rawUrl)) {
      const external = /^https?:\/\//i.test(rawUrl);
      return (
        <li key={item.id} className="mb-2.5">
          <a
            href={rawUrl}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="text-text-secondary hover:text-brand-primary transition-colors duration-300 text-base wrap-break-word"
          >
            {item.title || rawUrl}
          </a>
        </li>
      );
    }

    const href = localizePath(locale, rawUrl);

    return (
      <li key={item.id} className="mb-2.5">
        <Link
          href={href}
          className="text-text-secondary hover:text-brand-primary transition-colors duration-300 text-base wrap-break-word"
        >
          {item.title || rawUrl}
        </Link>
      </li>
    );
  };

  const renderSectionColumn = (
    sec: FooterSectionDto | undefined,
    colClass: string,
    extraWidgetClass?: string,
  ) => {
    if (!sec) return null;
    const items = itemsBySectionId.get(sec.id) ?? [];

    return (
      <div className={`${colClass} w-full`}>
        <div className={`mb-12 ${extraWidgetClass ?? ''}`}>
          <div className="mb-6">
            <h3 className="text-xl font-serif font-bold text-text-primary mb-6 relative pb-4 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-12 after:h-0.5 after:bg-brand-primary">
              {sec.title || sec.slug || ui('ui_footer_section', 'Links')}
            </h3>
          </div>
          <div className="footer__link">
            <ul>{items.map(renderMenuItem)}</ul>
          </div>
        </div>
      </div>
    );
  };

  const homeHref = localizePath(locale, '/');

  return (
    <footer className="w-full">
      <section className="bg-bg-primary pt-20 pb-10 border-t border-border-light">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* 1. kolon – COMPANY (footer__col-1) */}
            {renderSectionColumn(section1, 'col-span-1', 'footer__col-1')}

            {/* 2. kolon – Services (footer__col-2) */}
            {renderSectionColumn(section2, 'col-span-1', 'footer__col-2')}

            {/* 3. kolon – Explore (footer__col-3) */}
            {renderSectionColumn(section3, 'col-span-1', 'footer__col-3')}

            {/* 4. kolon – Logo + Contact + Socials (site_settings) */}
            <div className="col-span-1">
              <div className="mb-12">
                <div className="mb-6">
                  <Link href={homeHref} aria-label={brandName || 'Home'}>
                    <SiteLogo
                      variant="dark"
                      alt={brandName || 'Logo'}
                      priority={false}
                      wrapperClassName="w-48 sm:w-56 max-w-full"
                    />
                  </Link>
                </div>

                <div className="flex flex-col gap-3 mb-8 text-text-secondary wrap-break-word overflow-hidden">
                  {addrLines.map((ln, i) => (
                    <span key={`addr-${i}`} className="block">
                      {ln}
                    </span>
                  ))}

                  {phone && (
                    <span className="block font-medium hover:text-brand-primary transition-colors">
                      {phone}
                    </span>
                  )}
                  {email && (
                    <span className="block hover:text-brand-primary transition-colors">
                      {email}
                    </span>
                  )}
                  {website && (
                    <span className="block hover:text-brand-primary transition-colors">
                      {website}
                    </span>
                  )}
                </div>

                <div className="max-w-full overflow-hidden">
                  <SocialLinks socials={socials} size="md" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alt telif satırı – stil korunarak dinamik metin */}
      <div className="bg-bg-secondary py-6 border-t border-border-light">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center">
            <div className="text-center">
              <p className="text-sm text-text-secondary m-0">
                {ui('ui_footer_copyright_prefix', 'Copyright')} © {new Date().getFullYear()}{' '}
                <span className="font-semibold text-text-primary">
                  {brandName || 'konigsmassage'}
                </span>{' '}
                {ui('ui_footer_copyright_suffix', 'All rights reserved.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
