// =============================================================
// FILE: src/features/seo/ProductJsonLd.tsx
// konigsmassage – Product JSON-LD
// =============================================================

import React from 'react';
import type { SupportedLocale } from '@/types/common';
import { absoluteUrl, compact } from '@/features/seo/utils';

type OfferInput = {
  price?: number | string;
  priceCurrency?: string; // default ENV -> EUR
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder' | 'Discontinued';
  url?: string; // canonical product URL (optional override)
  priceValidUntil?: string; // ISO date
};

type AggregateRatingInput = {
  ratingValue: number;
  reviewCount: number;
};

type Props = {
  locale: SupportedLocale;
  url: string; // canonical URL (relative or absolute)
  name: string;
  description?: string;
  images?: string[]; // absolute/relative
  brand?: string;
  category?: string;
  sku?: string;
  mpn?: string;
  gtin?: string;
  color?: string | string[];
  material?: string;
  weightKg?: number;
  size?: string;
  offers?: OfferInput;
  aggregateRating?: AggregateRatingInput;
  additionalProps?: Record<string, string | number | boolean | undefined>;
};

function toNumberMaybe(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return undefined;
    // TR/EU format: "199,90" -> "199.90"
    const normalized = s.replace(/\./g, '').replace(',', '.');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export default function ProductJsonLd(props: Props) {
  const {
    locale,
    url,
    name,
    description,
    images = [],
    brand,
    category,
    sku,
    mpn,
    gtin,
    color,
    material,
    weightKg,
    size,
    offers,
    aggregateRating,
    additionalProps,
  } = props;

  const imageAbs = images
    .map((src) => String(src || '').trim())
    .filter(Boolean)
    .map(absoluteUrl);

  const offerData =
    offers && (offers.price != null || offers.url || offers.availability)
      ? compact({
          '@type': 'Offer',
          url: absoluteUrl(offers.url ? offers.url : url),
          price: toNumberMaybe(offers.price),
          priceCurrency: String(offers.priceCurrency || process.env.NEXT_PUBLIC_CURRENCY || 'EUR')
            .trim()
            .toUpperCase(),
          availability: offers.availability
            ? `https://schema.org/${offers.availability}`
            : undefined,
          priceValidUntil: offers.priceValidUntil,
        })
      : undefined;

  // Eğer price yoksa Offer içinde price alanını hiç basma (validator uyarılarını azaltır)
  if (offerData && (offerData as any).price === undefined) {
    delete (offerData as any).price;
  }

  const additionalProperty =
    additionalProps && Object.keys(additionalProps).length
      ? Object.entries(additionalProps)
          .map(([k, v]) => {
            const vv = v === undefined || v === null ? undefined : String(v).trim();
            if (!vv) return null;
            return compact({
              '@type': 'PropertyValue',
              name: String(k).trim(),
              value: vv,
            });
          })
          .filter(Boolean)
      : undefined;

  const agg =
    aggregateRating &&
    Number.isFinite(aggregateRating.ratingValue) &&
    aggregateRating.ratingValue > 0 &&
    Number.isFinite(aggregateRating.reviewCount) &&
    aggregateRating.reviewCount > 0
      ? compact({
          '@type': 'AggregateRating',
          ratingValue: aggregateRating.ratingValue,
          reviewCount: aggregateRating.reviewCount,
        })
      : undefined;

  const data = compact({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: String(name || '').trim(),
    description: description ? String(description).trim() : undefined,
    sku: sku ? String(sku).trim() : undefined,
    mpn: mpn ? String(mpn).trim() : undefined,
    gtin: gtin ? String(gtin).trim() : undefined,
    url: absoluteUrl(url),
    inLanguage: locale,
    image: imageAbs.length ? imageAbs : undefined,
    brand: brand ? { '@type': 'Brand', name: String(brand).trim() } : undefined,
    category: category ? String(category).trim() : undefined,
    color: Array.isArray(color)
      ? color
          .map((c) => String(c).trim())
          .filter(Boolean)
          .join(', ')
      : color
      ? String(color).trim()
      : undefined,
    material: material ? String(material).trim() : undefined,
    size: size ? String(size).trim() : undefined,
    weight:
      typeof weightKg === 'number' && Number.isFinite(weightKg)
        ? { '@type': 'QuantitativeValue', value: weightKg, unitCode: 'KGM' }
        : undefined,
    offers: offerData,
    aggregateRating: agg,
    additionalProperty:
      additionalProperty && additionalProperty.length ? additionalProperty : undefined,
  });

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
