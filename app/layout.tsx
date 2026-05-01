import './globals.css';
import type { Metadata, Viewport } from 'next';

const appIcon = '/kivo-app-image.png';

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
      { url: appIcon, type: 'image/png', sizes: '32x32' },
      { url: appIcon, type: 'image/png', sizes: '192x192' },
      { url: appIcon, type: 'image/png', sizes: '512x512' },
    ],
    shortcut: [
      { url: appIcon, type: 'image/png' },
    ],
    apple: [
      { url: appIcon, type: 'image/png', sizes: '180x180' },
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
        <link rel="icon" href={`${appIcon}?v=2`} type="image/png" />
        <link rel="shortcut icon" href={`${appIcon}?v=2`} type="image/png" />
        <link rel="apple-touch-icon" href={`${appIcon}?v=2`} />
      </head>
      <body>{children}</body>
    </html>
  );
}
