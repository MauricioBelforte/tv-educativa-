import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import StoreInitializer from '@/components/StoreInitializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TV Libre - Canales Gratuitos en Vivo',
  description: 'Plataforma educativa para ver canales de TV gratuitos en vivo. Proyecto de aprendizaje sobre streaming HLS y arquitectura web.',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <StoreInitializer />
        {children}
      </body>
    </html>
  )
}