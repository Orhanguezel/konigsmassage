// =============================================================
// FILE: src/layout/SiteLogo.tsx
// konigsmassage – Dynamic Site Logo (GLOBAL '*') [FINAL]
// - ✅ site_logo / site_logo_dark / site_logo_light from site_settings
// - ✅ No inline styles
// - ✅ Bigger logo + NO blur/background badge
// =============================================================

'use client';

import React, { useMemo } from 'react';
import Image, { type StaticImageData } from 'next/image';

import { useGetSiteSettingByKeyQuery } from '@/integrations/rtk/hooks';
import type { SettingValue } from '@/integrations/types';

type Variant = 'default' | 'dark' | 'light';

export type SiteLogoProps = {
  variant?: Variant;
  overrideSrc?: StaticImageData | string;
  alt?: string;
  className?: string; // applied to <Image>
  priority?: boolean;

  /** optional: add/override wrapper styles */
  wrapperClassName?: string; // applied to wrapper
};

const FALLBACK_URL =
  'https://res.cloudinary.com/dbozv7wqd/image/upload/v1768221636/site-media/logo2.png';

const DEFAULT_W = 260;
const DEFAULT_H = 96;

const variantKeyMap: Record<Variant, string> = {
  default: 'site_logo',
  dark: 'site_logo_dark',
  light: 'site_logo_light',
};

const safeStr = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

function extractMedia(val: SettingValue | null | undefined): {
  url: string;
  width?: number;
  height?: number;
} {
  if (val === null || val === undefined) return { url: '' };

  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return { url: '' };

    const looksJson =
      (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));

    if (!looksJson) return { url: s };

    try {
      const parsed = JSON.parse(s);
      const url = safeStr((parsed as any)?.url);
      const width = (parsed as any)?.width;
      const height = (parsed as any)?.height;
      return {
        url,
        width: typeof width === 'number' ? width : undefined,
        height: typeof height === 'number' ? height : undefined,
      };
    } catch {
      return { url: s };
    }
  }

  if (typeof val === 'object') {
    const obj = val as any;
    const url = safeStr(obj?.url);
    const width = obj?.width;
    const height = obj?.height;
    return {
      url,
      width: typeof width === 'number' ? width : undefined,
      height: typeof height === 'number' ? height : undefined,
    };
  }

  return { url: '' };
}

function cx(...parts: Array<string | undefined | null | false>) {
  return parts.filter(Boolean).join(' ');
}

export const SiteLogo: React.FC<SiteLogoProps> = ({
  variant = 'default',
  overrideSrc,
  alt = 'konigsmassage',
  className,
  wrapperClassName,
  priority = true,
}) => {
  const key = variantKeyMap[variant];

  const { data: setting } = useGetSiteSettingByKeyQuery({
    key,
    locale: '*',
  });

  const { url, width, height } = useMemo(
    () => extractMedia((setting?.value as SettingValue) ?? null),
    [setting?.value],
  );

  let finalSrc: StaticImageData | string = FALLBACK_URL;
  let finalW = DEFAULT_W;
  let finalH = DEFAULT_H;

  if (overrideSrc) {
    if (typeof overrideSrc === 'string') {
      finalSrc = overrideSrc;
    } else {
      finalSrc = overrideSrc;
      finalW = overrideSrc.width ?? DEFAULT_W;
      finalH = overrideSrc.height ?? DEFAULT_H;
    }
  } else {
    const u = safeStr(url);
    finalSrc = u || FALLBACK_URL;
    finalW = width || DEFAULT_W;
    finalH = height || DEFAULT_H;
  }

  return (
    <span className={cx('site-logo-wrap', wrapperClassName)} aria-label={alt}>
      <Image
        key={typeof finalSrc === 'string' ? finalSrc : 'settings-logo'}
        src={finalSrc}
        alt={alt}
        width={finalW}
        height={finalH}
        className={cx('site-logo-img', className)}
        sizes="(max-width: 576px) 170px, (max-width: 992px) 200px, 240px"
        priority={priority}
      />
    </span>
  );
};

SiteLogo.displayName = 'SiteLogo';
