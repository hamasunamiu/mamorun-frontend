"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Option = {
  value: string;
  label: string;
  icon?: ReactNode;
};

type ToggleOptionGroupProps = {
  label: string;
  required?: boolean;
  options: Option[];
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
  unselectedClassName?: string;
};

export function ToggleOptionGroup({
  label,
  required,
  options,
  value,
  onChange,
  error,
  unselectedClassName,
}: ToggleOptionGroupProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-foreground">
        {label}
        {/* 「必須」バッジ表示 */}
        {required && (
          <span className="ml-3.5 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
            必須
          </span>
        )}
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
                "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                isSelected
                  ? "border-[#C4956A] bg-[#FBE9DD] text-[#993C1D]"
                  : (unselectedClassName ??
                      "border-border bg-background text-muted-foreground"),
              )}
            >
              {option.icon}
              {option.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
