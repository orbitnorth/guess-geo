import { Fredoka, Nunito } from 'next/font/google'
import './globals.css'

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display-next',
  display: 'swap',
})

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-body-next',
  display: 'swap',
})

export const metadata = {
  title: 'GeoGuess - Globe Edition',
  description: 'GeoGuess - a five round globe guessing game built with Three.js, Next.js, and React.',
  icons: {
    icon: '/favicon.svg',
  },
}

export const viewport = {
  themeColor: '#e9f7ff',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  )
}
