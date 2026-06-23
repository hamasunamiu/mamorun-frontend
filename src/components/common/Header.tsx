"use client";

import { ChevronDown } from "lucide-react";

type HeaderProps = {
  /** シンプルなタイトル表示用（ログイン・設定画面など） */
  title?: string;
  /** ペット名表示用（お世話ホーム・病院情報画面など） */
  petName?: string;
  /** ヘッダー上部の日付表示（例：2026年6月12日（金）） */
  dateLabel?: string;
  /** ペット名タップ時の切り替え処理（2匹以上の場合のプルダウン） */
  onPetSwitch?: () => void;
  /** 右側に表示する追加要素（緊急発信ボタンなど） */
  rightSlot?: React.ReactNode;
};

export function Header({
  title,
  petName,
  dateLabel,
  onPetSwitch,
  rightSlot,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
      <div>
        {dateLabel && (
          <p className="text-xs text-muted-foreground">{dateLabel}</p>
        )}

        {petName ? (
          <button
            type="button"
            onClick={onPetSwitch}
            className="mt-0.5 flex min-h-11 items-center gap-1.5 text-lg font-medium text-foreground"
            aria-label="ペットを切り替える"
          >
            {petName}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        ) : (
          title && (
            <h1 className="text-lg font-medium text-foreground">{title}</h1>
          )
        )}
      </div>

      {rightSlot}
    </header>
  );
}