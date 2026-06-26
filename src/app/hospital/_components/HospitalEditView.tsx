"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { InputField } from "@/components/common/InputField";
import { ImageUploader } from "@/components/common/ImageUploader";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import type { Pet } from "./types";

type HospitalFormValues = {
  hospital_name: string;
  hospital_phone: string;
  hospital_address: string;
};

type HospitalEditViewProps = {
  pet: Pet | null;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  register: UseFormRegister<HospitalFormValues>;
  errors: FieldErrors<HospitalFormValues>;
  onHospitalCardSelect: (file: File | null) => void;
  onInsuranceCardSelect: (file: File | null) => void;
  saveError: string | null;
  isSubmitting: boolean;
  onCancel: () => void;
};

export function HospitalEditView({
  pet,
  onSubmit,
  register,
  errors,
  onHospitalCardSelect,
  onInsuranceCardSelect,
  saveError,
  isSubmitting,
  onCancel,
}: HospitalEditViewProps) {
  return (
    <div className="p-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4 flex flex-col gap-3">
          <InputField
            label="病院名"
            required
            placeholder="例：〇〇動物病院"
            {...register("hospital_name")}
            error={errors.hospital_name?.message}
          />

          <InputField
            label="電話番号"
            required
            type="tel"
            inputMode="numeric"
            placeholder="0312345678"
            {...register("hospital_phone")}
            error={errors.hospital_phone?.message}
          />

          <InputField
            label="住所"
            required
            placeholder="例：東京都渋谷区..."
            {...register("hospital_address")}
            error={errors.hospital_address?.message}
          />
        </div>

        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4 flex flex-col gap-4">
          <ImageUploader
            label="診察券"
            onFileSelect={onHospitalCardSelect}
            initialImageUrl={pet?.hospital_card_image_url ?? undefined}
          />
          <ImageUploader
            label="保険証"
            onFileSelect={onInsuranceCardSelect}
            initialImageUrl={pet?.insurance_card_image_url ?? undefined}
          />
        </div>

        {saveError && <ErrorMessage message={saveError} />}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 flex-1 rounded-2xl border border-border text-sm font-medium text-foreground"
          >
            キャンセル
          </button>
          <PrimaryButton
            type="submit"
            disabled={isSubmitting}
            className="h-12 flex-1 bg-[#D85A30] text-white hover:bg-[#D85A30] hover:opacity-85"
          >
            {isSubmitting ? <LoadingSpinner size="sm" /> : "保存する"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}