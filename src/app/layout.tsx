
import type { Metadata, Viewport } from 'next'; // Added Viewport
import { Montserrat } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';

const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });

const APP_NAME = "AquaTrack";
const APP_DESCRIPTION = "Tubewell Water Supply Management App";
const APP_THEME_COLOR_DARK = "#0F172A"; // From your dark theme background

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
    // startUpImage: [], // You can add startup images for iOS here
  },
  formatDetection: {
    telephone: false,
  },
  // Open Graph metadata (optional, for social sharing)
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_NAME,
      template: `%s | ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
  },
  // Twitter Card metadata (optional)
  twitter: {
    card: "summary",
    title: {
      default: APP_NAME,
      template: `%s | ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: APP_THEME_COLOR_DARK,
  width: 'device-width',
  initialScale: 1,
  // minimumScale: 1,
  // maximumScale: 1, // Consider if you want to disable pinch zoom
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          The manifest link is now handled by metadata.manifest
          <link rel="manifest" href="/manifest.json" />
        */}
        {/*
          Theme color is now handled by viewport.themeColor
          <meta name="theme-color" content={APP_THEME_COLOR_DARK} />
        */}
        {/* Apple touch icons can be added here or via metadata.icons.apple */}
        {/* Example: <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" /> */}
      </head>
      <body className={`${montserrat.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
