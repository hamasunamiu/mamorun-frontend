import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

type PremiumBadgeProps = {
  /** プレミアム会員かどうか */
  isPremium: boolean;
  /** 無料会員の場合の本日の残り利用回数（プレミアムの場合は無視される） */
  remainingCount?: number;
};

export function PremiumBadge({ isPremium, remainingCount }: PremiumBadgeProps) {
  if (isPremium) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-[#C4956A]/10 px-2 py-1 text-xs font-medium text-[#C4956A]">
        <Crown className="h-3 w-3" aria-hidden="true" />
        無制限
      </span>
    );
  }

  const isLimitReached = remainingCount === 0;

  return (
    <span
      className={cn(
        "inline-flex flex-col items-center rounded-md px-2 py-1 text-xs font-medium",
        isLimitReached
          ? "bg-destructive/10 text-destructive"
          : "bg-[#C4956A]/10 text-[#C4956A]"
      )}
    >
      <span className="text-[10px] font-normal">残り</span>
      <span>{remainingCount ?? 0}回</span>
    </span>
  );
}