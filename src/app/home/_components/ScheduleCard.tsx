"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ScheduleCardProps = {
  title: string;
  content: string | null;
  daysUntilLabel: string;
  isCompleted: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
};

export function ScheduleCard({
  title,
  content,
  daysUntilLabel,
  isCompleted,
  onToggle,
  onDelete,
  onEdit,
}: ScheduleCardProps) {
  // ★「期限切れ」かどうかで、あと○日ラベルの色を変える（緊急度の視覚的な区別）
  const isOverdue = daysUntilLabel === "期限切れ";

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4">
      {/* ★チェックボックス：ToDoCardと同じスタイルで統一（44px以上のタップ領域） */}
      <button
        type="button"
        onClick={onToggle}
        role="checkbox"
        aria-checked={isCompleted}
        aria-label={`${title}を${isCompleted ? "未完了" : "完了"}にする`}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
          isCompleted
            ? "border-[#C4956A] bg-[#C4956A]"
            : "border-[#D8C0A8] bg-white"
        }`}
      >
        {isCompleted && (
          <svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5 text-white"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 8.5L6.5 12L13 4.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`truncate text-sm font-medium ${
              isCompleted
                ? "text-muted-foreground line-through"
                : "text-foreground"
            }`}
          >
            {title}
          </span>
          {/* ★日付＋あと○日表示。期限切れの場合は注意を引く色にする（色だけでなくテキスト自体が意味を持つ） */}
          <span
            className={`shrink-0 text-xs font-medium ${
              isOverdue ? "text-destructive" : "text-[#9E7654]"
            }`}
          >
            {daysUntilLabel}
          </span>
        </div>
        {content && (
          <p className="mt-1 text-xs text-muted-foreground">{content}</p>
        )}
      </div>

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