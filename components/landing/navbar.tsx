"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  Home01Icon,
  Settings01Icon,
  LogoutSquare01Icon,
  CoinsDollarIcon,
} from "@hugeicons/core-free-icons"
import { authClient } from "@/lib/auth-client"
import { Menu, MenuTrigger, MenuPopup, MenuItem, MenuSeparator } from "@/components/ui/menu"

function Avatar({ src, name, size = 6 }: { src?: string | null; name?: string | null; size?: 6 | 10 }) {
  const [error, setError] = useState(false)
  const sizeClass = size === 6 ? "size-6 text-[11px]" : "size-10 text-sm"

  if (src && !error) {
    return (
      <img
        key={src}
        src={src}
        alt={name || ""}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setError(true)}
        className={`${sizeClass} rounded-md object-cover`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-md bg-zinc-300 dark:bg-zinc-600 flex items-center justify-center font-medium text-zinc-700 dark:text-zinc-200`}
    >
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  )
}

export function Navbar() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const { data: session } = authClient.useSession()
  const user = session?.user

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40)
    }
    addEventListener("scroll", onScroll, { passive: true })
    return () => removeEventListener("scroll", onScroll)
  }, [])

  async function handleSignOut() {
    await authClient.signOut()
    router.refresh()
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 flex justify-center transition-all duration-300",
        scrolled && "bg-zinc-50 dark:bg-zinc-900",
      )}
    >
      <div className="flex w-full max-w-7xl items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2.5">
          <Image
            alt="Rows"
            src="/logo.svg"
            width={22}
            height={22}
            className="dark:invert object-contain"
          />
          <span className="text-base font-normal tracking-tight antialiased text-zinc-900/85 dark:text-zinc-100/90">
            Rows
          </span>
        </div>

        {user ? (
          <Menu>
            <MenuTrigger className="flex items-center gap-1.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-md bg-zinc-100/80 dark:bg-zinc-800/80 pb-0.5  pl-0.5 pr-3 pt-0.5">
              <Avatar src={user.image} name={user.name} size={6} />
              <span className="text-sm font-normal tracking-tight antialiased text-zinc-900/85 dark:text-zinc-100/90">
                {user.name}&rsquo;s workspace
              </span>
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={1} className="text-zinc-500 dark:text-zinc-400 -mr-0.5" />
            </MenuTrigger>
            <MenuPopup sideOffset={6} align="end" className="w-56 rounded-md p-1">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Avatar src={user.image} name={user.name} size={10} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {user.name}
                  </span>
                  <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {user.email}
                  </span>
                </div>
              </div>

              <MenuSeparator />

              <MenuItem className="gap-2.5 text-xs" onClick={() => router.push("/")}>
                <HugeiconsIcon icon={Home01Icon} size={15} strokeWidth={1} />
                New workspace
              </MenuItem>

              <MenuItem className="gap-2.5 text-xs" disabled>
                <HugeiconsIcon icon={Settings01Icon} size={15} strokeWidth={1} />
                Settings
              </MenuItem>

              <MenuItem className="gap-2.5 text-xs" disabled>
                <HugeiconsIcon icon={CoinsDollarIcon} size={15} strokeWidth={1} />
                Credits
                <span className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium bg-orange-100/80 text-orange-700 dark:bg-orange-700/15 dark:text-orange-500">
                  Coming soon
                </span>
              </MenuItem>

              <MenuSeparator />

              <MenuItem className="gap-2.5 text-xs" onClick={handleSignOut}>
                <HugeiconsIcon icon={LogoutSquare01Icon} size={15} strokeWidth={1} />
                Sign out
              </MenuItem>
            </MenuPopup>
          </Menu>
        ) : (
          <Link
            href="/?signin=true"
            className="cursor-pointer text-base font-normal tracking-tighter antialiased text-zinc-900/85 dark:text-zinc-100/90 transition-colors hover:text-zinc-900/98 dark:hover:text-zinc-50/95 hover:underline focus-visible:outline-none focus-visible:underline"
          >
            Sign up
          </Link>
        )}
      </div>
    </header>
  )
}
