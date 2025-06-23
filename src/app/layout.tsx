import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; 


const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Optional: if you want to use it as a CSS variable
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Pulse Chat',
  description: 'AI powered chat application by || Mariwan.Dev',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} bg-background`}>
      <head>
        {/* Google Font links removed as next/font handles this optimally */}
      </head>
      <body className={`${inter.className} font-body antialiased`} suppressHydrationWarning>
        {children}
        <Toaster />

      </body>
    </html>
  );
}
