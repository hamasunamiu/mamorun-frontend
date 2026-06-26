"use client";

import { Modal } from "@/components/common/Modal";

type DeleteConfirmModalProps = {
  open: boolean;
  targetName: string | undefined;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmModal({
  open,
  targetName,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
      title="削除しますか？"
      description={
        targetName
          ? `「${targetName}」を削除します。この操作は取り消せません。`
          : undefined
      }
      footer={
        <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 flex-1 rounded-2xl border border-border text-sm font-medium text-foreground"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 flex-1 rounded-2xl bg-destructive text-sm font-medium text-white"
          >
            削除する
          </button>
        </div>
      }
    />
  );
}