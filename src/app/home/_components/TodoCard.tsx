"use client";

type TodoCardProps = {
  /** タスク名 */
  taskName: string;
  /** 完了フラグ */
  isCompleted: boolean;
  /** 完了者のユーザーID（表示名取得手段が未確定なため、現時点ではIDの一部のみ仮表示） */
  completedById: string | null;
  /** チェックボックスタップ時のコールバック */
  onToggle: () => void;
};

export function TodoCard({
  taskName,
  isCompleted,
  completedById, //あとで差し替え
  onToggle,
}: TodoCardProps) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-white p-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* ★チェックボックス：タップ領域は44px以上を確保（画面設計書アクセシビリティ方針準拠） */}
        <button
          type="button"
          onClick={onToggle}
          role="checkbox"
          aria-checked={isCompleted}
          aria-label={`${taskName}を${isCompleted ? "未完了" : "完了"}にする`}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
            isCompleted
              ? "border-[#C4956A] bg-[#C4956A]"
              : "border-[#D8C0A8] bg-white"
          }`}
        >
          {/* ★色だけで状態を表現しない：チェックマークを併用 */}
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

        <span
          className={`truncate text-sm ${
            isCompleted
              ? "text-muted-foreground line-through"
              : "text-foreground"
          }`}
        >
          {taskName}
        </span>
      </div>

      {/* ★完了者表示：display_nameの送信先・取得方法が未確定のため、
          現時点では人型アイコン＋IDの先頭4文字のみの仮表示。
          バックエンドでdisplay_nameカラム追加後、completed_by_name等に差し替える予定 */}
      {isCompleted && completedById && (
        <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <span aria-hidden="true">👤</span>
          <span>{completedById.slice(0, 4)}</span>
        </div>
      )}
    </div>
  );
}