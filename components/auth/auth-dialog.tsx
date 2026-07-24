"use client"

import { useState } from "react"
import Image from "next/image"
import { authClient } from "@/lib/auth-client"
import { Spinner } from "@/components/ui/loading-state/spinner"
import {
  Dialog,
  DialogPortal,
  DialogBackdrop,
  DialogViewport,
  DialogClose,
  DialogPrimitive,
} from "@/components/ui/dialog"

interface AuthDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [isSigningIn, setIsSigningIn] = useState(false)

  async function handleSignIn() {
    setIsSigningIn(true)
    try {
      await authClient.signIn.social({ provider: "google" })
    } catch {
      setIsSigningIn(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogViewport>
          <DialogPrimitive.Popup className="relative row-start-2 flex w-full max-w-sm flex-col rounded-xl bg-zinc-50 px-8 py-14 outline-none transition-all duration-200 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 dark:bg-zinc-900">
            <DialogClose className="absolute right-3 top-3 flex size-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-200/70 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
              <svg
                width="15"
                height="15"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M4 4L12 12M12 4L4 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </DialogClose>

            <div className="flex flex-col items-start">
              <Image
                      alt="Rows"
                      src="/logo.svg"
                      width={25}
                      height={25}
                      className="dark:invert object-contain"
                       />


              <div className="mt-4.5 space-y-1">
                <h2 className="text-[22px] font-normal tracking-tight text-zinc-950 dark:text-zinc-50">
                  Start designing
                </h2>

                <p className="text-[22px] leading-6 text-zinc-400 dark:text-zinc-500">
                  Get started with Google
                </p>
              </div>
            </div>


            <div className="mt-12">
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="flex w-full cursor-pointer items-center justify-center gap-2 hover:underline rounded-lg border border-zinc-200/75 bg-white px-7 py-2 text-sm font-normal text-zinc-700 transition-all hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-70 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                {isSigningIn ? (
                  <>
                    <Spinner size={18} color="currentColor" />
                    Redirecting
                  </>
                ) : (
                  <>
                    <Image
                      src="/google.svg"
                      alt=""
                      width={18}
                      height={18}
                      className="shrink-0"
                    />
                    Continue with Google
                  </>
                )}
              </button>
            </div>

            <div className="mt-10 flex items-start gap-2 pt-5 text-sm leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="13"
                height="13"
                color="currentColor"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="mt-0.5 shrink-0"
              >
                <path
                  d="M16.4964 9V6.5C16.4964 4.01472 14.4817 2 11.9964 2C9.51112 2 7.4964 4.01472 7.4964 6.5V9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.4958 9H10.4964C8.16158 9 6.99417 9 6.11049 9.47237C5.41275 9.84535 4.84128 10.4169 4.46837 11.1146C3.99608 11.9984 3.99619 13.1658 3.99641 15.5006C3.99662 17.835 3.99673 19.0023 4.46907 19.8858C4.84203 20.5835 5.41347 21.1548 6.11115 21.5277C6.99475 22 8.16197 22 10.4964 22H13.4958C15.8304 22 16.9978 22 17.8814 21.5277C18.5791 21.1548 19.1506 20.5833 19.5235 19.8856C19.9958 19.0019 19.9958 17.8346 19.9958 15.5C19.9958 13.1654 19.9958 11.9981 19.5235 11.1144C19.1506 10.4167 18.5791 9.84525 17.8814 9.47231C16.9978 9 15.8304 9 13.4958 9Z"
                  strokeLinecap="round"
                />
                <circle cx="11.9964" cy="15.5" r="2" />
              </svg>

              <span>
                SSO available on{" "}
                <u className="underline text-zinc-600 dark:text-zinc-400 decoration-zinc-600 dark:decoration-zinc-400">
                  Business
                </u>{" "}
                and{" "}
                <u className="underline text-zinc-600 dark:text-zinc-400 decoration-zinc-600 dark:decoration-zinc-400">
                  Enterprise
                </u>{" "}
                plan
              </span>
            </div>
          </DialogPrimitive.Popup>
        </DialogViewport>
      </DialogPortal>
    </Dialog>
  )
}
