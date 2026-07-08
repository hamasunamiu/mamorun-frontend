"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotebookPen } from "lucide-react";

type ScheduleCardProps = {
  title: string;
  content: string | null;
  daysUntilLabel: string;
  onDelete: () => void;
  onEdit: () => void;
};

export function ScheduleCard({
  title,
  content,
  daysUntilLabel,
  onDelete,
  onEdit,
}: ScheduleCardProps) {
  // ★「期限切れ」かどうかで、あと○日ラベルの色を変える（緊急度の視覚的な区別）
  const isOverdue = daysUntilLabel === "期限切れ";

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4">
      <NotebookPen
        className="h-5 w-5 shrink-0 text-accent-foreground"
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {title}
        </span>
        {content && (
          <p className="mt-1 text-xs text-muted-foreground">{content}</p>
        )}
      </div>

      {/* ★日付＋あと○日表示。期限切れの場合は注意を引く色にする（色だけでなくテキスト自体が意味を持つ） */}
      <span
        className={`shrink-0 text-sm font-medium ${
          isOverdue ? "text-destructive" : "text-accent-foreground"
        }`}
      >
        {daysUntilLabel}
      </span>

      {/* ★変更：削除ボタン単体ではなく、編集・削除をまとめたケバブメニューに変更 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`${title}のメニューを開く`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground"
          >
            <svg
              viewBox="0 0 16 16"
              className="h-4 w-4"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="8" cy="2.5" r="1.3" />
              <circle cx="8" cy="8" r="1.3" />
              <circle cx="8" cy="13.5" r="1.3" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>編集</DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
