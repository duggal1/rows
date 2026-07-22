import { Geist, Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeScript } from "@/components/theme-script"
import { ThemeProvider } from "@/components/theme-provider"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { cn } from "@/lib/utils"

const interHeading = Inter({ subsets: ["latin"], variable: "--font-heading" })

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        "font-mono",
        inter.variable,
        interHeading.variable,
        geistMono.variable
      )}
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider>
          <AnimatedThemeToggler className="fixed right-4 top-4 z-50 size-10 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
