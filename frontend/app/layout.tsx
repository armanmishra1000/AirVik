import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../src/contexts/auth.context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AirVik - Hotel Booking System',
  description: 'Modern hotel booking and management system with user registration and email verification',
  keywords: 'hotel booking, accommodation, travel, reservations',
  authors: [{ name: 'AirVik Team' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
