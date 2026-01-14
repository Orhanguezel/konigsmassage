// src/pages/robots.txt.ts
import type { GetServerSideProps, NextPage } from 'next';
import { getRequestBaseUrl } from '@/seo/serverBase';

const RobotsTxt: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { res } = ctx;

  const SITE = getRequestBaseUrl(ctx).replace(/\/+$/, '');
  const sitemapUrl = `${SITE}/sitemap.xml`;

  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /_next/',
    'Disallow: /api/',
    'Disallow: /admin/',
    'Disallow: /*/admin/',
    'Disallow: /login/',
    'Disallow: /*/login/',
    'Disallow: /dashboard/',
    'Disallow: /*/dashboard/',
    '',
    `Sitemap: ${sitemapUrl}`,
    // Host satırı opsiyonel. İstersen aç:
    // `Host: ${SITE}`,
    '',
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600');
  res.write(lines);
  res.end();

  return { props: {} };
};

export default RobotsTxt;
