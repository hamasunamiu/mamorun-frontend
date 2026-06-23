"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Timeline, MessageCircle, Building2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/home", label: "ホーム", icon: Home },
  { href: "/timeline", label: "タイムライン", icon: Timeline },
  { href: "/ai-chat", label: "AI相談", icon: MessageCircle },
  { href: "/hospital", label: "病院", icon: Building2 },
  { href: "/settings", label: "設定", icon: Settings },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-around border-t border-border bg-background py-2.5">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            className="flex min-h-11 min-w-11 flex-col items-center gap-0.5"
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              className={cn(
                "h-[22px] w-[22px]",
                isActive ? "text-emerald-600" : "text-muted-foreground"
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                "text-[10px]",
                isActive ? "text-emerald-600" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}