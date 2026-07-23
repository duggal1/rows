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
          fill={isDark ? "#1c1c1e" : "#FFFFFF"}
          stroke={isDark ? "#FFFFFF" : "#000000"}
          strokeWidth={15}
        />
        <rect
          x={138}
          y={27}
          width={109}
          height={32}
          rx={16}
          ry={16}
          fill={isDark ? "#FFFFFF" : "#000000"}
        />
        <circle
          cx={211}
          cy={43}
          r={3.2}
          fill="#34C759"
        />
      </svg>
      <div className="absolute left-[22px] top-[22px] h-[750px] w-[342px] overflow-hidden rounded-[56px]">
        {children}
      </div>
    </div>
  )
}
