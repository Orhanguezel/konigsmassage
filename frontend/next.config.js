/** @type {import('next').NextConfig} */

// ✅ Bundle Analyzer (ANALYZE=true için)
// DIKKAT: require KOSULSUZ yapilmamali. `@next/bundle-analyzer` bir
// devDependency; production install'da budanir ve kosulsuz require
// next.config.js'i tamamen yuklenemez hale getirir.
// 2026-09-03: bu satir konigsmassage-frontend'i 4.260 kez crash dongusune
// soktu, tek cekirdekli VPS'te CPU'yu doldurdu ve TUM siteleri dusurdu.
// Detay: vps-guezel/docs/CPU-KRIZI-2026-09-03.md
const withBundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? require('@next/bundle-analyzer')({ enabled: true })
    : (config) => config;


const nextConfig = {
  turbopack: {},
  reactStrictMode: true,
  trailingSlash: false,
  compress: true,

  // ✅ Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // ✅ Experimental optimizations
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      'lucide-react',
      'date-fns',
    ],
  },

  // ✅ Webpack config
  webpack: (config, { isServer }) => {
    return config;
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },

      { protocol: 'http', hostname: 'localhost', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', pathname: '/**' },

      { protocol: 'https', hostname: 'konigsmassage.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.konigsmassage.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.konigsmassage.com', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },

  async redirects() {
    return [
      // www → non-www (canonical: koenigsmassage.com)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.koenigsmassage.com' }],
        destination: 'https://koenigsmassage.com/:path*',
        permanent: true,
      },
      // .de → .com redirects
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'konigsmassage.de' }],
        destination: 'https://koenigsmassage.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.konigsmassage.de' }],
        destination: 'https://koenigsmassage.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'koenigsmassage.de' }],
        destination: 'https://koenigsmassage.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.koenigsmassage.de' }],
        destination: 'https://koenigsmassage.com/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
