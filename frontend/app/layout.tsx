import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../src/contexts/auth.context'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>AirVik - Hotel Booking System</title>
        <meta name="description" content="Modern hotel booking and management system with user registration and email verification" />
        <meta name="keywords" content="hotel booking, accommodation, travel, reservations" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="author" content="AirVik Team" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
