import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ weight: ['400', '600', '700', '800'], subsets: ['latin'], variable: '--font-sans' })

export const metadata = {
  title: 'OKAERI',
  description: 'A palate memory for drinks. Live pilot: Takara Sake, Berkeley.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
