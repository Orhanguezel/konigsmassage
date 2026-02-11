/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,

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
  },

  async redirects() {
    return [];
  },
};

module.exports = nextConfig;
