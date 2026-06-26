"use client";

import { Card } from "@/components/common/Card";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import type { Pet } from "./types";

type HospitalDisplayViewProps = {
  pet: Pet | null;
  onEditClick: () => void;
};

export function HospitalDisplayView({
  pet,
  onEditClick,
}: HospitalDisplayViewProps) {
  return (
    <div className="p-4 flex flex-col gap-4">
      <Card>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs text-muted-foreground">病院名</p>
            <p className="text-sm text-foreground">
              {pet?.hospital_name || "未登録"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">電話番号</p>
            <p className="text-sm text-foreground">
              {pet?.hospital_phone || "未登録"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">住所</p>
            <p className="text-sm text-foreground">
              {pet?.hospital_address || "未登録"}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">診察券</p>
            {pet?.hospital_card_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pet.hospital_card_image_url}
                alt="診察券のプレビュー"
                className="h-72 w-full rounded-md border border-border object-cover"
              />
            ) : (
              <p className="text-sm text-muted-foreground">未登録</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">保険証</p>
            {pet?.insurance_card_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pet.insurance_card_image_url}
                alt="保険証のプレビュー"
                className="h-72 w-full rounded-md border border-border object-cover"
              />
            ) : (
              <p className="text-sm text-muted-foreground">未登録</p>
            )}
          </div>
        </div>
      </Card>

      <PrimaryButton
        type="button"
        onClick={onEditClick}
        className="w-full bg-[#D85A30] text-white hover:bg-[#D85A30] hover:opacity-85"
      >
        編集する
      </PrimaryButton>
    </div>
  );
}