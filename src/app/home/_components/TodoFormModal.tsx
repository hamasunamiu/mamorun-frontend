"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { RefreshCw } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { InputField } from "@/components/common/InputField";
import { PrimaryButton } from "@/components/common/PrimaryButton";

type TodoFormValues = {
  taskName: string;
  isDaily: boolean;
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
          data-testid="todo-title-input"
          placeholder="例：朝ごはん　7時"
          className="border-[#a8825f] placeholder:text-[#8a6d54]"
          {...register("taskName")}
          error={errors.taskName?.message}
        />

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register("isDaily")}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-sm text-foreground flex items-center gap-1.5">
            <RefreshCw size={14} className="text-muted-foreground" />
            毎日自動で追加する
          </span>
        </label>

        <PrimaryButton
          type="submit"
          data-testid="todo-save-button"
          className="h-12 rounded-2xl"
        >
          {isEditing ? "更新する" : "追加する"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}
