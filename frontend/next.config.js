// next.config.js
/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('next').NextConfig} */

const getDefaultLocaleShort = () => {
  const raw = String(process.env.NEXT_PUBLIC_DEFAULT_LOCALE || '')
    .trim()
    .toLowerCase();
  const short = raw.replace('_', '-').split('-')[0] || '';
  return short || 'de';
};

const getPrefixlessFlag = () => {
  const raw = String(process.env.NEXT_PUBLIC_DEFAULT_LOCALE_PREFIXLESS || '')
    .trim()
    .toLowerCase();
  if (!raw) return true;
  return raw === '1' || raw === 'true' || raw === 'yes';
};

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,

  images: {
    // ✅ legacy allowlist (harmless + bazı ortamlarda daha stabil)
    domains: [
      'res.cloudinary.com',
      'images.unsplash.com',
      'picsum.photos',
      'localhost',
      '127.0.0.1',
      'cdn.example.com',
      'konigsmassage.de',
      'www.konigsmassage.de',
      'cdn.konigsmassage.de',
      'your-real-cdn.com',
    ],

    // ✅ modern allowlist
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },

      // ✅ FIX: picsum.photos allow
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },

      { protocol: 'http', hostname: 'localhost', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', pathname: '/**' },

      { protocol: 'https', hostname: 'cdn.example.com', pathname: '/**' },

      { protocol: 'https', hostname: 'konigsmassage.de', pathname: '/**' },
      { protocol: 'https', hostname: 'www.konigsmassage.de', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.konigsmassage.de', pathname: '/**' },
      { protocol: 'https', hostname: 'your-real-cdn.com', pathname: '/**' },
    ],

    formats: ['image/avif', 'image/webp'],
  },

  async redirects() {
    const defaultLc = getDefaultLocaleShort();
    const prefixless = getPrefixlessFlag();

    if (prefixless && defaultLc) {
      return [
        { source: `/${defaultLc}`, destination: '/', permanent: true },
        { source: `/${defaultLc}/:path*`, destination: '/:path*', permanent: true },
      ];
    }

    return [];
  },

  async rewrites() {
    const localeSrc = ':lc([a-z]{2,3}(?:-[a-zA-Z]{2,4})?)';

    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        { source: `/${localeSrc}/:path*`, destination: '/:path*?__lc=:lc' },
        { source: `/${localeSrc}`, destination: '/?__lc=:lc' },
      ],
    };
  },

  webpack: (config) => {
    config.cache = { type: 'memory' };
    return config;
  },
};

module.exports = nextConfig;
