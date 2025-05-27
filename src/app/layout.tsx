
import type { Metadata, Viewport } from 'next';
import { Roboto } from 'next/font/google'; // Changed from Montserrat to Roboto
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';

const roboto = Roboto({ // Changed font
  subsets: ['latin'],
  weight: ['400', '500', '700'], // Added common weights
  variable: '--font-roboto', // Changed variable name
});

const APP_NAME = "AquaTrack";
const APP_DESCRIPTION = "Tubewell Water Supply Management App";
const APP_THEME_COLOR_DARK = "#101D2E"; // Example dark theme background

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
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_NAME,
      template: `%s | ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
  },
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
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${roboto.variable} font-sans antialiased`}> {/* Use Roboto variable */}
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
