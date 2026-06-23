import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  /** スピナーのサイズ（デフォルト: md） */
  size?: "sm" | "md" | "lg";
  /** スピナーの横に表示するメッセージ（任意） */
  label?: string;
  /** 追加のクラス名 */
  className?: string;
};

const SIZE_MAP = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
} as const;

export function LoadingSpinner({
  size = "md",
  label,
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn("flex items-center justify-center gap-2", className)}
      role="status"
      aria-live="polite"
    >
      <Loader2
        className={cn(SIZE_MAP[size], "animate-spin text-[#C4956A]")}
        aria-hidden="true"
      />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
      <span className="sr-only">読み込み中</span>
    </div>
  );
}