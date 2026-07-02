"use client";

import { useState } from "react";

export function useEntityModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openForAdd = () => {
    setEditingId(null);
    setIsOpen(true);
  };

  const openForEdit = (id: string) => {
    setEditingId(id);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setEditingId(null);
  };

  return {
    isOpen,
    editingId,
    isEditing: editingId !== null,
    openForAdd,
    openForEdit,
    close,
  };
}
