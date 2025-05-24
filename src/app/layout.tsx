
import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google'; // Changed from Inter to Montserrat
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';

const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' }); // Initialized Montserrat

export const metadata: Metadata = {
  title: 'AquaTrack Mobile',
  description: 'Tubewell Water Supply Management App',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.variable} font-sans antialiased`}> {/* Used Montserrat variable */}
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
