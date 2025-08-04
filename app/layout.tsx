import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { WalletProvider } from '@/contexts/wallet-context'
import { WebSocketProvider } from '@/contexts/websocket-context'

export const metadata: Metadata = {
  title: 'Token Rivals',
  description: 'Real-time cryptocurrency tournament system',
  generator: 'Token Rivals',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <WebSocketProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </WebSocketProvider>
      </body>
    </html>
  )
}
