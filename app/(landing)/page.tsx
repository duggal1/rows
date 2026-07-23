"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Hero } from "@/components/landing/hero"

export default function Page() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(url: string) {
    const id = crypto.randomUUID()
    startTransition(() => {
      router.push(`/workspace/${id}?url=${encodeURIComponent(url)}`)
    })
  }

  return <Hero onSubmit={handleSubmit} isPending={isPending} />
}
