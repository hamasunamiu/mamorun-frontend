"use client";

import { ChevronDown } from "lucide-react";

type HeaderProps = {
  title?: string;
  petName?: string;
  petSpecies?: "dog" | "cat";
  suffix?: string;
  dateLabel?: string;
  onPetSwitch?: () => void;
  rightSlot?: React.ReactNode;
};

export function Header({
  title,
  petName,
  petSpecies,
  suffix,
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
            {suffix && <span>{suffix}</span>}
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