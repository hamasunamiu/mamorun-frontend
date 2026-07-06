"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputField } from "@/components/common/InputField";
import { TextAreaField } from "@/components/common/TextAreaField";
import { ToggleOptionGroup } from "@/components/common/ToggleOptionGroup";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { supabase } from "@/lib/supabase";
import { Dog, Cat } from "lucide-react";

const petSchema = z.object({
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

type PetFormValues = z.infer<typeof petSchema>;

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
  mode: "edit" | "add";
  pet?: Pet | null;
  onSaved: () => void;
};

export function PetEditModal({
  open,
  onOpenChange,
  mode,
  pet,
  onSaved,
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PetFormValues>({
    resolver: zodResolver(petSchema),
  });

  useEffect(() => {
    if (mode === "edit" && pet) {
      reset({
        name: pet.name,
        species: pet.species,
        gender: pet.gender,
        birthday: pet.birthday,
        illness: pet.illness ?? "",
      });
    } else if (mode === "add") {
      reset({
        name: "",
        species: undefined as unknown as "dog" | "cat",
        gender: undefined as unknown as "male" | "female",
        birthday: "",
        illness: "",
      });
    }
  }, [open, mode, pet, reset]);

  const onSubmit = async (values: PetFormValues) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (mode === "edit" && pet) {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pets/${pet.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(values),
        },
      );
      if (!res.ok) {
        alert("ペット情報の更新に失敗しました。");
        return;
      }
    } else if (mode === "add") {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(values),
        },
      );
      if (!res.ok) {
        alert("ペットの追加に失敗しました。");
        return;
      }
    }

    onSaved();
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "edit" ? "ペット情報を編集" : "ペットを追加"}
      description={
        mode === "edit"
          ? "変更したい項目を編集して保存してください"
          : "新しいペットの情報を入力してください"
      }
      footer={
        <PrimaryButton
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="w-full rounded-3xl bg-[#C69A6B] hover:bg-[#C69A6B] hover:opacity-85"
        >
          {isSubmitting ? (
            <LoadingSpinner size="sm" />
          ) : mode === "edit" ? (
            "保存する"
          ) : (
            "追加する"
          )}
        </PrimaryButton>
      }
    >
      <div className="flex flex-col gap-4 py-2">
  <Controller
    control={control}
    name="species"
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
        error={errors.species?.message}
      />
    )}
  />

  <InputField
    label="名前"
    required
    placeholder="例：むぎ"
    className="border-[#a8825f] placeholder:text-[#8a6d54]"
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
        unselectedClassName="border-[#a8825f] bg-background text-accent-foreground"
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
    className="border-[#a8825f] register-date-input"
    {...register("birthday")}
    error={errors.birthday?.message}
  />

  <TextAreaField
    label="持病・特記事項"
    placeholder="例：アレルギーあり"
    className="border-[#a8825f] placeholder:text-[#8a6d54]"
    {...register("illness")}
    error={errors.illness?.message}
  />
</div>
    </Modal>
  );
}
