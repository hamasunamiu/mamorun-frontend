"use client";

import { PrimaryButton } from "@/components/common/PrimaryButton";
import { PawPrint } from "lucide-react";
import { TodoCard } from "./TodoCard";
import type { Todo, TodoTemplate } from "./types";

type TodoSectionProps = {
  todos: Todo[];
  todoTemplates: TodoTemplate[];  // ★追加
  onAddClick: () => void;
  onToggle: (todoId: string) => void;
  onDeleteRequest: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onToggleTemplate: (template: TodoTemplate) => void;  // ★追加
};

export function TodoSection({
  todos,
  todoTemplates,
  onAddClick,
  onToggle,
  onDeleteRequest,
  onEdit,
  onToggleTemplate,
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
          data-testid="ui002-todo-add-button"
          onClick={onAddClick}
          className="min-h-11 border-2 border-accent-foreground/30 text-xs font-bold text-accent-foreground hover:bg-accent hover:text-accent-foreground"
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
          {todos.map((todo) => {
            // ★task_nameが一致するテンプレートを検索
            const template =
              todoTemplates.find((t) => t.task_name === todo.task_name) ?? null;
            return (
              <TodoCard
                key={todo.id}
                id={todo.id}
                taskName={todo.task_name}
                isCompleted={todo.is_completed}
                completedById={todo.completed_by_id}
                completedByName={todo.completed_by?.display_name ?? null}
                template={template}
                onToggle={() => onToggle(todo.id)}
                onDelete={() => onDeleteRequest(todo)}
                onEdit={() => onEdit(todo)}
                onToggleTemplate={onToggleTemplate}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}