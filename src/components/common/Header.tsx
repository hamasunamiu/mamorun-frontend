"use client";

import { ChevronDown } from "lucide-react";

type HeaderProps = {
  /** シンプルなタイトル表示用（ログイン・設定画面など） */
  title?: string;
  /** ペット名表示用（お世話ホーム・病院情報画面など） */
  petName?: string;
  /** ペットの種類（名前の左に犬・猫の絵文字を表示するために使用） */
  petSpecies?: "dog" | "cat";
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
  petSpecies,
  dateLabel,
  onPetSwitch,
  rightSlot,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-background py-3 pl-7 pr-4">
      <div>
        {dateLabel && (
          <p className="text-md text-muted-foreground">{dateLabel}</p>
        )}

        {petName ? (
          <button
            type="button"
            onClick={onPetSwitch}
            className="mt-0.5 flex min-h-11 items-center gap-1.5 text-xl font-medium text-foreground"
            aria-label="ペットを切り替える"
          >
            {petName}
            {petSpecies && (
              <span aria-hidden="true">
                {petSpecies === "dog" ? "🐶" : "🐱"}
              </span>
            )} 
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