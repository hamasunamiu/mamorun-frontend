"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputField } from "@/components/common/InputField";
import { TextAreaField } from "@/components/common/TextAreaField";
import { ToggleOptionGroup } from "@/components/common/ToggleOptionGroup";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { supabase } from "@/lib/supabase";

const petEditSchema = z.object({
  name: z
    .string()
    .min(1, "名前を入力してください")
    .max(50, "50文字以内で入力してください"),
  species: z.enum(["dog", "cat"], { message: "犬または猫を選択してください" }),
  gender: z.enum(["male", "female"], { message: "性別を選択してください" }),
  birthday: z
    .string()
    .min(1, "正しい日付を入力してください")
    .refine((val) => new Date(val) <= new Date(), {
      message: "生年月日に未来の日付は設定できません",
    }),
  illness: z
    .string()
    .max(1000, "1000文字以内で入力してください")
    .optional()
    .or(z.literal("")),
});

type PetEditFormValues = z.infer<typeof petEditSchema>;

type Pet = {
  id: string;
  name: string;
  species: "dog" | "cat";
  gender: "male" | "female";
  birthday: string;
  illness?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet: Pet | null;
  onSaved: () => void;
};

export function PetEditModal({ open, onOpenChange, pet, onSaved }: Props) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PetEditFormValues>({
    resolver: zodResolver(petEditSchema),
  });

  // モーダルが開くたびに現在のペット情報をフォームにセット
  useEffect(() => {
    if (pet) {
      reset({
        name: pet.name,
        species: pet.species,
        gender: pet.gender,
        birthday: pet.birthday,
        illness: pet.illness ?? "",
      });
    }
  }, [pet, reset]);

  const onSubmit = async (values: PetEditFormValues) => {
    console.log("送信データ:", values);
    console.log("pet:", pet);
    if (!pet) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch(`http://localhost:3001/api/pets/${pet.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      return;
    }

    onSaved();
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="ペット情報を編集"
      description="変更したい項目を編集して保存してください"
      footer={
        <PrimaryButton
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="w-full rounded-3xl bg-[#C69A6B] hover:bg-[#C69A6B] hover:opacity-85"
        >
          {isSubmitting ? <LoadingSpinner size="sm" /> : "保存する"}
        </PrimaryButton>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <Controller
          control={control}
          name="species"
          render={({ field: f }) => (
            <ToggleOptionGroup
              label="種類"
              required
              value={f.value}
              onChange={f.onChange}
              options={[
                { value: "dog", label: "犬", icon: "🐶" },
                { value: "cat", label: "猫", icon: "🐱" },
              ]}
              error={errors.species?.message}
            />
          )}
        />

        <InputField
          label="名前"
          required
          placeholder="例：むぎ"
          {...register("name")}
          error={errors.name?.message}
        />

        <Controller
          control={control}
          name="gender"
          render={({ field: f }) => (
            <ToggleOptionGroup
              label="性別"
              required
              value={f.value}
              onChange={f.onChange}
              options={[
                { value: "male", label: "おとこのこ" },
                { value: "female", label: "おんなのこ" },
              ]}
              error={errors.gender?.message}
            />
          )}
        />

        <InputField
          label="生年月日"
          required
          type="date"
          {...register("birthday")}
          error={errors.birthday?.message}
        />

        <TextAreaField
          label="持病・特記事項"
          placeholder="例：アレルギーあり"
          {...register("illness")}
          error={errors.illness?.message}
        />
      </div>
    </Modal>
  );
}
