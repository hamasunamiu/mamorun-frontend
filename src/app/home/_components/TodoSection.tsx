"use client";

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
        <h2 className="text-md font-semibold text-[#6E5849]">
          🐾 今日のお世話
        </h2>
        <button
          type="button"
          data-testid="ui002-todo-add-button"
          onClick={onAddClick}
          className="flex min-h-11 items-center gap-1 rounded-lg border border-[#D8C0A8] px-2.5 text-xs font-bold text-[#993C1D]"
        >
          お世話を追加
        </button>
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
              id={todo.id}
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