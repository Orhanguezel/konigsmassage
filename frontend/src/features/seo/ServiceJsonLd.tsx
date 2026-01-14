// src/features/seo/ServiceJsonLd.tsx

import React from 'react';
import { absoluteUrl, compact } from './utils';

type Props = {
  name: string;
  description?: string;
  areaServed?: string[]; // ["Germany"] veya ["DE"]
  serviceType?: string;
  providerName?: string;
  url?: string;
  images?: string[];
};

export default function ServiceJsonLd({
  name,
  description,
  areaServed = [],
  serviceType,
  providerName,
  url,
  images = [],
}: Props) {
  const imageAbs = images
    .map((x) => String(x || '').trim())
    .filter(Boolean)
    .map(absoluteUrl);

  const data = compact({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: String(name || '').trim(),
    description: description ? String(description).trim() : undefined,
    serviceType: serviceType ? String(serviceType).trim() : undefined,

    // Basit kullanım: string listesi. İstersen bunu Country objesine çevirebiliriz.
    areaServed: areaServed.length ? areaServed : undefined,

    provider: providerName
      ? compact({ '@type': 'Organization', name: String(providerName).trim() })
      : undefined,

    image: imageAbs.length ? imageAbs : undefined,
    url: url ? absoluteUrl(url) : undefined,
  });

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
