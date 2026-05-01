import './globals.css';
import type { Metadata, Viewport } from 'next';

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
      { url: '/kivo-logo.png', type: 'image/png' },
    ],
    shortcut: [
      { url: '/kivo-logo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/kivo-logo.png', type: 'image/png' },
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
      <body>{children}</body>
    </html>
  );
}
