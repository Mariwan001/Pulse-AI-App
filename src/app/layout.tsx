import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; 
import Head from 'next/head';


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
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <body className={`${inter.className} font-body antialiased`} suppressHydrationWarning>
        {children}
        <Toaster />

      </body>
    </html>
  );
}
