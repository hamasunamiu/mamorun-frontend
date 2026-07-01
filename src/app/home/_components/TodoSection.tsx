"use client";

import { PrimaryButton } from "@/components/common/PrimaryButton";
import { PawPrint } from "lucide-react";
import { TodoCard } from "./TodoCard";
import type { Todo } from "./types";

type TodoSectionProps = {
  todos: Todo[];
  onAddClick: () => void;
  onToggle: (todoId: string) => void;
  onDeleteRequest: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
};

export function TodoSection({
  todos,
  onAddClick,
  onToggle,
  onDeleteRequest,
  onEdit,
}: TodoSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-lg font-semibold text-[#6E5849]">
          <PawPrint className="h-4 w-4" aria-hidden="true" />
          今日のお世話
        </h2>
        <PrimaryButton
          type="button"
          variant="outline"
          onClick={onAddClick}
          className="min-h-11 border-accent-foreground/30 text-xs font-bold text-accent-foreground"
        >
          お世話を追加
        </PrimaryButton>
      </div>

      {todos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          今日のToDoはまだ登録されていません
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {todos.map((todo) => (
            <TodoCard
              key={todo.id}
              taskName={todo.task_name}
              isCompleted={todo.is_completed}
              completedById={todo.completed_by_id}
              completedByName={todo.completed_by?.display_name ?? null}
              onToggle={() => onToggle(todo.id)}
              onDelete={() => onDeleteRequest(todo)}
              onEdit={() => onEdit(todo)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
