"use client";

import { cn } from "@/lib/utils";

type Option = {
  value: string;
  label: string;
  icon?: string;
};

type ToggleOptionGroupProps = {
  /** ラベル */
  label: string;
  /** 必須項目かどうか */
  required?: boolean;
  /** 選択肢一覧 */
  options: Option[];
  /** 現在選択されている値 */
  value: string | undefined;
  /** 選択変更時のコールバック */
  onChange: (value: string) => void;
  /** バリデーションエラーメッセージ */
  error?: string;
};

export function ToggleOptionGroup({
  label,
  required,
  options,
  value,
  onChange,
  error,
}: ToggleOptionGroupProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </p>
      <div className="flex gap-2">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={isSelected}
              className={cn(
                "min-h-11 flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                isSelected
                  ? "border-[#C4956A] bg-[#FBE9DD] text-[#993C1D]"
                  : "border-border bg-background text-muted-foreground"
              )}
            >
              {option.icon && <span className="mr-1.5">{option.icon}</span>}
              {option.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}