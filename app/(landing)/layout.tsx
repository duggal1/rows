import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <ThemeToggle />
      {children}
    </>
  )
}
