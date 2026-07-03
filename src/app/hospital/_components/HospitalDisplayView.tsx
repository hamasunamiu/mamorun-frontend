"use client";

import { Hospital, NotebookText, Image as ImageIcon } from "lucide-react";
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
      <div>
        <h3 className="flex items-center gap-1.5 text-base font-semibold text-[#6E5849] mb-2">
          <Hospital className="h-[18px] w-[18px]" aria-hidden="true" />
          病院情報
        </h3>
        <Card className="ring-0">
          <dl className="flex flex-col gap-3">
            <div>
              <dt className="text-sm text-[#8a6d54] font-medium">病院名</dt>
              <dd className="text-lg text-foreground">
                {pet?.hospital_name || "未登録"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[#8a6d54] font-medium">電話番号</dt>
              <dd className="text-lg text-foreground">
                {pet?.hospital_phone || "未登録"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[#8a6d54] font-medium">住所</dt>
              <dd className="text-lg text-foreground">
                {pet?.hospital_address || "未登録"}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <div>
        <h3 className="flex items-center gap-1.5 text-base font-semibold text-[#6E5849] mb-2">
          <NotebookText className="h-[18px] w-[18px]" aria-hidden="true" />
          持病
        </h3>
        <Card className="ring-0">
          <dl>
            <div>
              <dt className="sr-only">持病</dt>
              <dd className="text-lg text-foreground whitespace-pre-wrap">
                {pet?.illness || "未登録"}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <div>
        <h3 className="flex items-center gap-1.5 text-base font-semibold text-[#6E5849] mb-2">
          <ImageIcon className="h-[18px] w-[18px]" aria-hidden="true" />
          画像
        </h3>
        <Card className="ring-0">
          <dl className="flex flex-col gap-4">
            <div>
              <dt className="text-sm text-[#8a6d54] font-medium mb-1.5">
                診察券
              </dt>
              <dd>
                {pet?.hospital_card_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pet.hospital_card_image_url}
                    alt="診察券のプレビュー"
                    className="aspect-[3/2] w-full rounded-md border border-border object-cover"
                  />
                ) : (
                  <p className="text-lg text-muted-foreground">未登録</p>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[#8a6d54] font-medium mb-1.5">
                保険証
              </dt>
              <dd>
                {pet?.insurance_card_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pet.insurance_card_image_url}
                    alt="保険証のプレビュー"
                    className="aspect-[3/2] w-full rounded-md border border-border object-cover"
                  />
                ) : (
                  <p className="text-lg text-muted-foreground">未登録</p>
                )}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <PrimaryButton
        type="button"
        onClick={onEditClick}
        className="w-full h-14 rounded-3xl text-base"
      >
        編集する
      </PrimaryButton>
    </div>
  );
}
