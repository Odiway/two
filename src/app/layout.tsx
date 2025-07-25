import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Temsada Batarya Üretim Departmanı',
  description: 'Batarya üretim departmanı proje yönetim sistemi',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='tr'>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}
