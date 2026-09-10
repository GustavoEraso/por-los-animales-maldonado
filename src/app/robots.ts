import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

const PUBLIC_PATHS = [
  '/',
  '/adopta',
  '/donaciones',
  '/donaciones/paypalsuscripciones',
  '/involucrate',
  '/nosotros',
];

const PRIVATE_PATHS = ['/login', '/bingo', '/gracias', '/plam-admin', '/plam-admin/:path*'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: PUBLIC_PATHS,
      disallow: PRIVATE_PATHS,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
