import './globals.css';
import type { Metadata, Viewport } from 'next';

const faviconIcon = '/favicon.png';
const icon192 = '/icons/icon-192.png';
const icon512 = '/icons/icon-512.png';
const appleTouchIcon = '/icons/apple-touch-icon.png';

export const metadata: Metadata = {
  title: 'Kivo',
  description: 'Your personal AI assistant',
  applicationName: 'Kivo',
  appleWebApp: {
    capable: true,
    title: 'Kivo',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: faviconIcon, type: 'image/png', sizes: '32x32' },
      { url: icon192, type: 'image/png', sizes: '192x192' },
      { url: icon512, type: 'image/png', sizes: '512x512' },
    ],
    shortcut: [
      { url: faviconIcon, type: 'image/png' },
    ],
    apple: [
      { url: appleTouchIcon, type: 'image/png', sizes: '180x180' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#f3f3f5',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href={`${faviconIcon}?v=4`} type="image/png" />
        <link rel="shortcut icon" href={`${faviconIcon}?v=4`} type="image/png" />
        <link rel="apple-touch-icon" href={`${appleTouchIcon}?v=4`} />
      </head>
      <body>{children}</body>
    </html>
  );
}
