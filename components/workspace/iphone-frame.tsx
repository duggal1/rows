"use client"

import { useTheme } from "@/lib/theme-context"
import { cn } from "@/lib/utils"

interface IPhoneFrameProps {
  children: React.ReactNode
  className?: string
}

export function IPhoneFrame({ children, className }: IPhoneFrameProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: 386, height: 794 }}
    >
      <svg
        width={386}
        height={794}
        viewBox="0 0 386 794"
        className="absolute inset-0"
      >
        <rect
          x="10.5"
          y="10.5"
          width={365}
          height={773}
          rx={72}
          ry={72}
          fill="#FFFFFF"
          stroke={isDark ? "#E4E4E7" : "#000000"}
          strokeWidth={6}
        />
      </svg>
      <div className="absolute left-[19px] top-[19px] z-10 h-[756px] w-[348px] overflow-hidden rounded-[56px] pt-12">
        {children}
      </div>
      <svg
        width={386}
        height={794}
        viewBox="0 0 386 794"
        className="pointer-events-none absolute inset-0 z-20"
      >
        <rect
          x={138}
          y={27}
          width={109}
          height={32}
          rx={16}
          ry={16}
          fill={isDark ? "rgba(245,245,245,0.8)" : "#000000"}
        />
        <circle
          cx={211}
          cy={43}
          r={3.2}
          fill="#34C759"
        />
      </svg>
    </div>
  )
}