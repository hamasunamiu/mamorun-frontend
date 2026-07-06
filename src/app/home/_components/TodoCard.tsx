"use client";

import { User, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TodoTemplate } from "./types";

type TodoCardProps = {
  id: string;
  taskName: string;
  isCompleted: boolean;
  completedById: string | null;
  completedByName: string | null;
  template: TodoTemplate | null;  // ★追加
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onToggleTemplate: (template: TodoTemplate) => void;  // ★追加
};

export function TodoCard({
  id,
  taskName,
  isCompleted,
  completedById,
  completedByName,
  template,
  onToggle,
  onDelete,
  onEdit,
  onToggleTemplate,
}: TodoCardProps) {
  return (
    <div
      data-testid={`todo-item-${id}`}
      data-completed={isCompleted ? "true" : "false"}
      className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-white p-4"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          data-testid={`todo-checkbox-${id}`}
          onClick={onToggle}
          role="checkbox"
          aria-checked={isCompleted}
          aria-label={`${taskName}を${isCompleted ? "未完了" : "完了"}にする`}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
            isCompleted
              ? "border-primary bg-primary hover:bg-primary/80"
              : "border-accent-foreground/30 bg-white hover:border-primary hover:bg-accent"
          }`}
        >
          {isCompleted && (
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5 text-white"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 8.5L6.5 12L13 4.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span
            className={`truncate text-sm font-medium ${
              isCompleted
                ? "text-muted-foreground line-through"
                : "text-foreground"
            }`}
          >
            {taskName}
          </span>
          {/* ★毎日自動タスクのアイコン表示 */}
          {template && (
            <RefreshCw
              className={`h-3 w-3 shrink-0 ${
                template.is_active
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
              aria-label="毎日自動タスク"
            />
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isCompleted && completedById && (
          <div className="flex shrink-0 items-center gap-1 text-sm font-medium text-accent-foreground">
            <User className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{completedByName ?? completedById.slice(0, 4)}</span>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`${taskName}のメニューを開く`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground"
            >
              <svg
                viewBox="0 0 16 16"
                className="h-4 w-4"
                fill="currentColor"
                aria-hidden="true"
              >
                <circle cx="8" cy="2.5" r="1.3" />
                <circle cx="8" cy="8" r="1.3" />
                <circle cx="8" cy="13.5" r="1.3" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>編集</DropdownMenuItem>
            {/* ★毎日自動タスクのON/OFF切り替え */}
            {template && (
              <DropdownMenuItem onClick={() => onToggleTemplate(template)}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                {template.is_active ? "毎日自動をOFFにする" : "毎日自動をONにする"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}