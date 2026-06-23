"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReactNode } from "react";

type ModalProps = {
  /** モーダルの開閉状態 */
  open: boolean;
  /** 開閉状態が変化した時のコールバック（背景クリック・Escキー含む） */
  onOpenChange: (open: boolean) => void;
  /** モーダルのタイトル */
  title: string;
  /** タイトル下の説明文（任意） */
  description?: string;
  /** モーダル本体のコンテンツ（フォーム等を差し込む場合） */
  children?: ReactNode;
  /** フッターに表示するボタン群（キャンセル・保存・削除など） */
  footer?: ReactNode;
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {children}

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}