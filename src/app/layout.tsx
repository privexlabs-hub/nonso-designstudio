import type { Metadata, Viewport } from 'next';
import { themeBootScript } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Nonso Stitches — Brand studio', template: '%s — Nonso Stitches' },
  description: 'Design system, brand playbook, voice reference, asset library, template library and visual editor for Nonso Stitches.',
  icons: { icon: '/assets/logo/nonso-stitches-badge-192.png', apple: '/assets/logo/nonso-stitches-badge-180.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F3F4F2' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0A08' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
