import type { Metadata } from "next"
import { Navbar } from "@/components/landing/navbar"
import { ThemeToggle } from "@/components/theme-toggle"

export const metadata: Metadata = {
  title: "Rows — AI Agentic Design Builder",
  description:
    "Rows is an AI agentic design builder that clones any website into production-ready Next.js code. Paste a URL and get clean, structured React + Tailwind components.",
  icons: {
    icon: "/logo-white.svg",
  },
}

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Navbar />
      <ThemeToggle />
      {children}
    </>
  )
}
