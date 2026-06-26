"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Modal } from "@/components/common/Modal";
import { InputField } from "@/components/common/InputField";
import { PrimaryButton } from "@/components/common/PrimaryButton";

type TodoFormValues = {
  taskName: string;
};

type TodoFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  register: UseFormRegister<TodoFormValues>;
  errors: FieldErrors<TodoFormValues>;
};

export function TodoFormModal({
  open,
  onOpenChange,
  isEditing,
  onSubmit,
  register,
  errors,
}: TodoFormModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "ToDoを編集する" : "ToDoを追加する"}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <InputField
          label="タスク名"
          required
          placeholder="例：朝ごはん　7時"
          {...register("taskName")}
          error={errors.taskName?.message}
        />
        <PrimaryButton
          type="submit"
          className="h-12 rounded-2xl bg-[#C69A6B] hover:bg-[#C69A6B] hover:opacity-85"
        >
          {isEditing ? "更新する" : "追加する"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}