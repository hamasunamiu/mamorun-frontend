"use client";

import { Dog, Cat } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import type { Pet } from "@/types";

type PetSwitchModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petList: Pet[];
  currentPetId: string | undefined;
  onSwitch: (pet: Pet) => void;
};

export function PetSwitchModal({
  open,
  onOpenChange,
  petList,
  currentPetId,
  onSwitch,
}: PetSwitchModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="ペットを切り替える">
      <div className="flex flex-col gap-2">
        {petList.map((p) => {
          const isSelected = p.id === currentPetId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSwitch(p)}
              aria-pressed={isSelected}
              className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium ${
                isSelected
                  ? "border-[#C4956A] bg-[#FBE9DD] text-[#993C1D]"
                  : "border-border bg-background text-foreground"
              }`}
            >
              {p.species === "dog" ? (
                <Dog className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Cat className="h-5 w-5" aria-hidden="true" />
              )}
              {p.name}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
