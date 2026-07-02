"use client";

import {
  Controller,
  type Control,
  type UseFormRegister,
  type FieldErrors,
} from "react-hook-form";
import { Trash2, Dog, Cat, PawPrint } from "lucide-react";
import { InputField } from "@/components/common/InputField";
import { TextAreaField } from "@/components/common/TextAreaField";
import { ToggleOptionGroup } from "@/components/common/ToggleOptionGroup";
import type { RegisterFormValues } from "../page";

type PetFormSectionProps = {
  index: number;
  control: Control<RegisterFormValues>;
  register: UseFormRegister<RegisterFormValues>;
  errors: FieldErrors<RegisterFormValues>;
  canRemove: boolean;
  onRemove: () => void;
};

export function PetFormSection({
  index,
  control,
  register,
  errors,
  canRemove,
  onRemove,
}: PetFormSectionProps) {
  return (
    <section
      data-testid={`ui001a-pet-form-${index}`}
      className="flex flex-col gap-3 rounded-2xl bg-white p-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-lg font-semibold text-[#6E5849]">
          <PawPrint className="h-4 w-4" aria-hidden="true" />
          ペット情報【{index + 1}匹目】
        </h2>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="このペットを削除"
            className="text-muted-foreground"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <Controller
        control={control}
        name={`pets.${index}.species`}
        render={({ field: f }) => (
          <ToggleOptionGroup
            label="ペット"
            required
            value={f.value}
            onChange={f.onChange}
            unselectedClassName="border-[#a8825f] bg-background text-accent-foreground"
            options={[
              {
                value: "dog",
                label: "犬",
                icon: <Dog className="h-4 w-4" aria-hidden="true" />,
              },
              {
                value: "cat",
                label: "猫",
                icon: <Cat className="h-4 w-4" aria-hidden="true" />,
              },
            ]}
            error={errors.pets?.[index]?.species?.message}
          />
        )}
      />

      <InputField
        label="名前"
        required
        data-testid="name-input"
        placeholder="例：むぎ"
        className="border-[#a8825f] placeholder:text-[#8a6d54]"
        {...register(`pets.${index}.name`)}
        error={errors.pets?.[index]?.name?.message}
      />

      <Controller
        control={control}
        name={`pets.${index}.gender`}
        render={({ field: f }) => (
          <ToggleOptionGroup
            label="性別"
            required
            value={f.value}
            onChange={f.onChange}
            unselectedClassName="border-[#a8825f] bg-background text-accent-foreground"
            options={[
              { value: "male", label: "おとこのこ" },
              { value: "female", label: "おんなのこ" },
            ]}
            error={errors.pets?.[index]?.gender?.message}
          />
        )}
      />

      <InputField
        label="生年月日"
        required
        type="date"
        data-testid="birthday-input"
        className="border-[#a8825f] register-date-input"
        {...register(`pets.${index}.birthday`)}
        error={errors.pets?.[index]?.birthday?.message}
      />

      <TextAreaField
        label="持病・特記事項"
        placeholder="例：アレルギーあり"
        className="border-[#a8825f] placeholder:text-[#8a6d54]"
        {...register(`pets.${index}.illness`)}
        error={errors.pets?.[index]?.illness?.message}
      />
    </section>
  );
}
