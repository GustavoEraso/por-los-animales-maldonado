import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.porlosanimalesmaldonado.org';

const PUBLIC_PATHS = [
  '/',
  '/adopta',
  '/donaciones',
  '/donaciones/paypalsuscripciones',
  '/involucrate',
  '/nosotros',
];

const PRIVATE_PATHS = [
  '/login',
  '/bingo',
  '/gracias',
  '/plam-admin',
  '/plam-admin/:path*',
  '/adopta/:path*',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: PUBLIC_PATHS,
      disallow: PRIVATE_PATHS,
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
