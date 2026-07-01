"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Modal } from "@/components/common/Modal";
import { InputField } from "@/components/common/InputField";
import { TextAreaField } from "@/components/common/TextAreaField";
import { PrimaryButton } from "@/components/common/PrimaryButton";

type ScheduleFormValues = {
  title: string;
  scheduledContent?: string;
  scheduledDate: string;
};

type ScheduleFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  register: UseFormRegister<ScheduleFormValues>;
  errors: FieldErrors<ScheduleFormValues>;
};

export function ScheduleFormModal({
  open,
  onOpenChange,
  isEditing,
  onSubmit,
  register,
  errors,
}: ScheduleFormModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "予定を編集する" : "予定を追加する"}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <InputField
          label="タイトル"
          required
          placeholder="例：フィラリア薬"
          {...register("title")}
          error={errors.title?.message}
        />
        <TextAreaField
          label="予定内容"
          placeholder="例：毎月15日に投与"
          {...register("scheduledContent")}
          error={errors.scheduledContent?.message}
        />
        <InputField
          label="予定日"
          required
          type="date"
          {...register("scheduledDate")}
          error={errors.scheduledDate?.message}
        />
        <PrimaryButton type="submit" className="h-12 rounded-2xl">
          {isEditing ? "更新する" : "追加する"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}
