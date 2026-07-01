"use client";

import { useState } from "react";
import { useEntityModal } from "./_components/useEntityModal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/common/Header";
import { BottomNavigation } from "@/components/common/BottomNavigation";
import { EmergencyCallButton } from "@/components/common/EmergencyCallButton";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { formatDateLabel } from "@/lib/dateFormat";
import type { Pet, Todo, Schedule } from "./_components/types";
import { useCareHomeData } from "./_components/useCareHomeData";
import { PetSwitchModal } from "@/components/common/PetSwitchModal";
import { DeleteConfirmModal } from "./_components/DeleteConfirmModal";
import { TodoFormModal } from "./_components/TodoFormModal";
import { ScheduleFormModal } from "./_components/ScheduleFormModal";
import { TodoSection } from "./_components/TodoSection";
import { ScheduleSection } from "./_components/ScheduleSection";
import { apiFetch } from "@/lib/api-client";
import { setSelectedPetId } from "@/lib/petStorage";

// ============================================================
// フォーム用Zodスキーマ（画面設計書のバリデーション表に準拠）
// ============================================================

const scheduleFormSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルを入力してください")
    .max(255, "255文字以内で入力してください"),
  scheduledContent: z
    .string()
    .max(1000, "1000文字以内で入力してください")
    .optional()
    .or(z.literal("")),
  scheduledDate: z
    .string()
    .min(1, "予定日を入力してください")
    .refine(
      (val) => {
        const inputDate = new Date(val + "T00:00:00");
        const today = new Date();
        const todayMidnight = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        );
        return inputDate >= todayMidnight;
      },
      { message: "予定日に過去の日付は設定できません" },
    ),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

const todoFormSchema = z.object({
  taskName: z
    .string()
    .min(1, "タスク名を入力してください")
    .max(250, "250文字以内で入力してください"),
});

type TodoFormValues = z.infer<typeof todoFormSchema>;

export default function CareHomePage() {
  // ------------------------------------------------------------
  // データ取得・Realtime同期（useCareHomeDataフックに集約）
  // ------------------------------------------------------------
  const {
    profile,
    pet,
    setPet,
    todos,
    setTodos,
    schedules,
    petList,
    isLoading,
    loadError,
    isMounted,
  } = useCareHomeData();

  // ------------------------------------------------------------
  // state（このコンポーネント固有のUI状態）
  // ------------------------------------------------------------
  const todoModal = useEntityModal();
  const scheduleModal = useEntityModal();
  const [isPetSwitchModalOpen, setIsPetSwitchModalOpen] = useState(false);

  // 削除確認Modal用：「何を削除しようとしているか」をtype/id/nameで保持し、
  // ToDo・予定共通の確認Modalを1つだけ用意する
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "todo" | "schedule";
    id: string;
    name: string;
  } | null>(null);

  // ------------------------------------------------------------
  // フォーム
  // ------------------------------------------------------------
  const {
    register: registerTodo,
    handleSubmit: handleSubmitTodo,
    reset: resetTodoForm,
    formState: { errors: todoErrors },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: {
      taskName: "",
    },
  });

  const {
    register: registerSchedule,
    handleSubmit: handleSubmitSchedule,
    reset: resetScheduleForm,
    formState: { errors: scheduleErrors },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      title: "",
      scheduledContent: "",
      scheduledDate: "",
    },
  });

  // ------------------------------------------------------------
  // ToDo関連のイベントハンドラ
  // ------------------------------------------------------------

  const handleStartAddTodo = () => {
    resetTodoForm({ taskName: "" });
    todoModal.openForAdd();
  };

  const handleRequestDeleteTodo = (todo: Todo) => {
    setDeleteTarget({ type: "todo", id: todo.id, name: todo.task_name });
  };

  const handleStartEditTodo = (todo: Todo) => {
    resetTodoForm({ taskName: todo.task_name });
    todoModal.openForEdit(todo.id);
  };

  const handleToggleTodo = async (todoId: string) => {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;

    const nextIsCompleted = !todo.is_completed;

    // 楽観的更新：自分の操作なので、Realtimeを待たずにその場で表示を更新する
    setTodos((prevTodos) =>
      prevTodos.map((t) =>
        t.id === todoId
          ? {
              ...t,
              is_completed: nextIsCompleted,
              completed_by: nextIsCompleted
                ? { display_name: profile?.display_name ?? null }
                : null,
            }
          : t,
      ),
    );

    try {
      await apiFetch(`/api/todos/${todoId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_completed: nextIsCompleted }),
      });
    } catch (err) {
      console.error("ToDo完了切り替え失敗:", err);
      // 失敗時はロールバック（元の状態に戻す）
      setTodos((prevTodos) =>
        prevTodos.map((t) => (t.id === todoId ? todo : t)),
      );
    }
  };

  // editingTodoIdの有無で「新規追加」か「既存の更新」かを分岐する
  const onSubmitTodo = async (values: TodoFormValues) => {
    if (todoModal.editingId) {
      try {
        await apiFetch(`/api/todos/${todoModal.editingId}`, {
          method: "PATCH",
          body: JSON.stringify({ task_name: values.taskName }),
        });
        setTodos((prevTodos) =>
          prevTodos.map((todo) =>
            todo.id === todoModal.editingId
              ? { ...todo, task_name: values.taskName }
              : todo,
          ),
        );
      } catch (err) {
        console.error("ToDo更新失敗:", err);
      }
    } else {
      try {
        await apiFetch("/api/todos", {
          method: "POST",
          body: JSON.stringify({ task_name: values.taskName }),
        });
      } catch (err) {
        console.error("ToDo作成失敗:", err);
      }
    }

    resetTodoForm();
    todoModal.close();
  };

  // ------------------------------------------------------------
  // 予定（Schedule）関連のイベントハンドラ
  // ------------------------------------------------------------

  const handleStartAddSchedule = () => {
    resetScheduleForm({
      title: "",
      scheduledContent: "",
      scheduledDate: "",
    });
    scheduleModal.openForAdd();
  };

  const handleRequestDeleteSchedule = (schedule: Schedule) => {
    setDeleteTarget({
      type: "schedule",
      id: schedule.id,
      name: schedule.title,
    });
  };

  const handleStartEditSchedule = (schedule: Schedule) => {
    resetScheduleForm({
      title: schedule.title,
      scheduledContent: schedule.scheduled_content ?? "",
      scheduledDate: schedule.scheduled_date,
    });
    scheduleModal.openForEdit(schedule.id);
  };

  const handleToggleSchedule = async (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule) return;

    try {
      await apiFetch(`/api/schedules/${scheduleId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_completed: !schedule.is_completed }),
      });
    } catch (err) {
      console.error("スケジュール完了切り替え失敗:", err);
    }
  };

  // editingScheduleIdの有無で「新規追加」か「既存の更新」かを分岐する
  const onSubmitSchedule = async (values: ScheduleFormValues) => {
    if (scheduleModal.editingId) {
      try {
        await apiFetch(`/api/schedules/${scheduleModal.editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: values.title,
            scheduled_content: values.scheduledContent || undefined,
            scheduled_date: values.scheduledDate,
          }),
        });
      } catch (err) {
        console.error("スケジュール更新失敗:", err);
      }
    } else {
      //新規追加モード
      try {
        await apiFetch("/api/schedules", {
          method: "POST",
          body: JSON.stringify({
            title: values.title,
            scheduled_content: values.scheduledContent || undefined,
            scheduled_date: values.scheduledDate,
          }),
        });
      } catch (err) {
        console.error("スケジュール追加失敗:", err);
      }
    }

    resetScheduleForm();
    scheduleModal.close();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "todo") {
        await apiFetch(`/api/todos/${deleteTarget.id}`, { method: "DELETE" });
        // Realtimeがstateを更新するので setTodos は不要
      } else {
        await apiFetch(`/api/schedules/${deleteTarget.id}`, {
          method: "DELETE",
        });
      }
    } catch (err) {
      console.error("削除失敗:", err);
    }

    setDeleteTarget(null);
  };

  const handleSwitchPet = (selectedPet: Pet) => {
    setPet(selectedPet);
    setSelectedPetId(selectedPet.id);
    setIsPetSwitchModalOpen(false);
  };

  // ------------------------------------------------------------
  // 早期return（ローディング・エラー）
  // ------------------------------------------------------------

  if (isLoading) {
    return (
      <main className="mx-auto flex h-dvh w-full max-w-[430px] items-center justify-center bg-[#FAF8F6]">
        <LoadingSpinner size="lg" />
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="mx-auto flex h-dvh w-full max-w-[430px] items-center justify-center bg-[#FAF8F6] px-6">
        <ErrorMessage message={loadError} />
      </main>
    );
  }

  // ------------------------------------------------------------
  // 本体UI
  // ------------------------------------------------------------

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#FAF8F6]">
      <Header
        petName={pet?.name}
        petSpecies={pet?.species}
        onPetSwitch={() => {
          // TODO: 複数ペット一覧取得APIの仕様確定後に実装
          if (petList.length > 1) {
            setIsPetSwitchModalOpen(true);
          }
        }}
        rightSlot={
          pet?.hospital_phone ? (
            <EmergencyCallButton phoneNumber={pet.hospital_phone} />
          ) : undefined
        }
      />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        {isMounted && (
          <p className="mb-5 text-xl font-semibold text-accent-foreground">
            {formatDateLabel(new Date())}
          </p>
        )}

        {/* 今日のお世話ToDoチェックリスト */}
        <TodoSection
          todos={todos}
          onAddClick={handleStartAddTodo}
          onToggle={handleToggleTodo}
          onDeleteRequest={handleRequestDeleteTodo}
          onEdit={handleStartEditTodo}
        />

        {/* 今後の予定一覧 */}
        <ScheduleSection
          schedules={schedules}
          isMounted={isMounted}
          onAddClick={handleStartAddSchedule}
          onToggle={handleToggleSchedule}
          onDeleteRequest={handleRequestDeleteSchedule}
          onEdit={handleStartEditSchedule}
        />
      </main>

      {/* ToDo追加・編集用のModal */}
      <TodoFormModal
        open={todoModal.isOpen}
        onOpenChange={(open) =>
          open ? todoModal.openForAdd() : todoModal.close()
        }
        isEditing={todoModal.isEditing}
        onSubmit={handleSubmitTodo(onSubmitTodo)}
        register={registerTodo}
        errors={todoErrors}
      />

      {/* 予定追加・編集用のModal */}
      <ScheduleFormModal
        open={scheduleModal.isOpen}
        onOpenChange={(open) =>
          open ? scheduleModal.openForAdd() : scheduleModal.close()
        }
        isEditing={scheduleModal.isEditing}
        onSubmit={handleSubmitSchedule(onSubmitSchedule)}
        register={registerSchedule}
        errors={scheduleErrors}
      />

      {/* 削除確認用のModal（ToDo・予定共通） */}
      <DeleteConfirmModal
        open={deleteTarget !== null}
        targetName={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* ペット切り替え用のModal（2匹以上の場合に表示） */}
      <PetSwitchModal
        open={isPetSwitchModalOpen}
        onOpenChange={setIsPetSwitchModalOpen}
        petList={petList}
        currentPetId={pet?.id}
        onSwitch={handleSwitchPet}
      />

      {/* 画面下部の共通ナビゲーション */}
      <BottomNavigation />
    </div>
  );
}
