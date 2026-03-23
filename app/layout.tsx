import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JamBets — Call it before they play it',
  description: 'Prediction markets for jam band shows. Write the line, call the set.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#09090B] text-white antialiased">
        {children}
      </body>
    </html>
  )
}
