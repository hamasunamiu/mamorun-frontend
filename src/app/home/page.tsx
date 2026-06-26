"use client";

import { useState } from "react";
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
import { PetSwitchModal } from "./_components/PetSwitchModal";
import { DeleteConfirmModal } from "./_components/DeleteConfirmModal";
import { TodoFormModal } from "./_components/TodoFormModal";
import { ScheduleFormModal } from "./_components/ScheduleFormModal";
import { TodoSection } from "./_components/TodoSection";
import { ScheduleSection } from "./_components/ScheduleSection";

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
          today.getDate()
        );
        return inputDate >= todayMidnight;
      },
      { message: "予定日に過去の日付は設定できません" }
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
    setSchedules,
    petList,
    isLoading,
    loadError,
    isMounted,
  } = useCareHomeData();

  // ------------------------------------------------------------
  // state（このコンポーネント固有のUI状態）
  // ------------------------------------------------------------
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(
    null
  );
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
    setEditingTodoId(null);
    resetTodoForm({ taskName: "" });
    setIsTodoModalOpen(true);
  };
  
  const handleRequestDeleteTodo = (todo: Todo) => {
    setDeleteTarget({ type: "todo", id: todo.id, name: todo.task_name });
  };

  const handleStartEditTodo = (todo: Todo) => {
    setEditingTodoId(todo.id);
    resetTodoForm({ taskName: todo.task_name });
    setIsTodoModalOpen(true);
  };

  const handleToggleTodo = (todoId: string) => {
    // 本来はPATCH /api/todos/:todoIdを呼ぶ必要があるが、バックエンド未接続のため
    // 現時点ではフロント側のstateのみを更新する（バックエンド接続後にAPI呼び出しを追加する）
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              is_completed: !todo.is_completed,
              // ※本来はバックエンドがauth.uid()から自動付与するため、
              // フロントから明示的に送信する必要はない（API設計書準拠）。
              // ここではモック表示用に自分のprofile.idを仮で入れている
              completed_by_id: !todo.is_completed
                ? (profile?.id ?? null)
                : null,
            }
          : todo
      )
    );
  };

  // editingTodoIdの有無で「新規追加」か「既存の更新」かを分岐する
  const onSubmitTodo = (values: TodoFormValues) => {
    if (editingTodoId) {
      // 編集モード：本来はPATCH /api/todos/:todoIdを呼ぶ必要があるが、
      // バックエンド未接続のため現時点ではフロント側のstateのみを更新する
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === editingTodoId
            ? { ...todo, task_name: values.taskName }
            : todo
        )
      );
    } else {
      // 新規追加モード
      // ★注記：react-hooks/purity が、イベントハンドラ内のDate.now()呼び出しを
      // レンダリング中の呼び出しと誤検知する既知の問題のため、id行のみ無効化する。
      // 参考：https://github.com/facebook/react/issues/34834
      const newTodo: Todo = {
        // eslint-disable-next-line react-hooks/purity
        id: `todo-${Date.now()}`, // ※仮のID。本来はバックエンドが発行するUUIDを使う
        pet_id: pet?.id ?? "",
        task_name: values.taskName,
        is_completed: false,
        completed_by_id: null,
        completed_at: null,
        // ★注記：todo_dateも本来はバックエンドがJST基準で算出するため送信不要（API設計書準拠）。
        // ここではモック表示用の仮の値として、isMounted後のnew Date()を使う
        todo_date: isMounted ? new Date().toISOString().slice(0, 10) : "",
        created_at: new Date().toISOString(),
      };
      setTodos((prevTodos) => [...prevTodos, newTodo]);
    }

    resetTodoForm();
    setEditingTodoId(null);
    setIsTodoModalOpen(false);
  };

  // ------------------------------------------------------------
  // 予定（Schedule）関連のイベントハンドラ
  // ------------------------------------------------------------

  const handleStartAddSchedule = () => {
    setEditingScheduleId(null);
    resetScheduleForm({
      title: "",
      scheduledContent: "",
      scheduledDate: "",
    });
    setIsScheduleModalOpen(true);
  };

  const handleRequestDeleteSchedule = (schedule: Schedule) => {
    setDeleteTarget({ type: "schedule", id: schedule.id, name: schedule.title });
  };

  const handleStartEditSchedule = (schedule: Schedule) => {
    setEditingScheduleId(schedule.id);
    resetScheduleForm({
      title: schedule.title,
      scheduledContent: schedule.scheduled_content ?? "",
      scheduledDate: schedule.scheduled_date,
    });
    setIsScheduleModalOpen(true);
  };

  const handleToggleSchedule = (scheduleId: string) => {
    // 本来はPATCH /api/schedules/:scheduleIdを呼ぶ必要があるが、バックエンド未接続のため
    // 現時点ではフロント側のstateのみを更新する（バックエンド接続後にAPI呼び出しを追加する）
    setSchedules((prevSchedules) =>
      prevSchedules.map((schedule) =>
        schedule.id === scheduleId
          ? { ...schedule, is_completed: !schedule.is_completed }
          : schedule
      )
    );
  };

  // editingScheduleIdの有無で「新規追加」か「既存の更新」かを分岐する
  const onSubmitSchedule = (values: ScheduleFormValues) => {
    if (editingScheduleId) {
      // 編集モード：本来はPATCH /api/schedules/:scheduleIdを呼ぶ必要があるが、
      // バックエンド未接続のため現時点ではフロント側のstateのみを更新する
      setSchedules((prevSchedules) =>
        prevSchedules.map((schedule) =>
          schedule.id === editingScheduleId
            ? {
                ...schedule,
                title: values.title,
                scheduled_content: values.scheduledContent || null,
                scheduled_date: values.scheduledDate,
              }
            : schedule
        )
      );
    } else {
      // 新規追加モード
      // ★注記：react-hooks/purity が、イベントハンドラ内のDate.now()呼び出しを
      // レンダリング中の呼び出しと誤検知する既知の問題のため、id行のみ無効化する。
      // 参考：https://github.com/facebook/react/issues/34834
      const newSchedule: Schedule = {
        // eslint-disable-next-line react-hooks/purity
        id: `schedule-${Date.now()}`, // ※仮のID。本来はバックエンドが発行するUUIDを使う
        pet_id: pet?.id ?? "",
        title: values.title,
        scheduled_content: values.scheduledContent || null,
        scheduled_date: values.scheduledDate,
        is_completed: false,
        created_at: new Date().toISOString(),
      };
      setSchedules((prevSchedules) => [...prevSchedules, newSchedule]);
    }

    resetScheduleForm();
    setEditingScheduleId(null);
    setIsScheduleModalOpen(false);
  };

  // ------------------------------------------------------------
  // 削除（ToDo・予定共通）
  // ------------------------------------------------------------

  // 本来はDELETE /api/todos/:todoId または DELETE /api/schedules/:scheduleId を呼ぶ必要があるが、
  // バックエンド未接続のため現時点ではフロント側のstateのみを更新する
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "todo") {
      setTodos((prevTodos) =>
        prevTodos.filter((todo) => todo.id !== deleteTarget.id)
      );
    } else {
      setSchedules((prevSchedules) =>
        prevSchedules.filter((schedule) => schedule.id !== deleteTarget.id)
      );
    }

    setDeleteTarget(null);
  };

  const handleSwitchPet = (selectedPet: Pet) => {
    setPet(selectedPet);
    setIsPetSwitchModalOpen(false);
  };

  // ------------------------------------------------------------
  // 早期return（ローディング・エラー）
  // ------------------------------------------------------------

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center bg-[#FAF8F6]">
        <LoadingSpinner size="lg" />
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center bg-[#FAF8F6] px-6">
        <ErrorMessage message={loadError} />
      </main>
    );
  }

  // ------------------------------------------------------------
  // 本体UI
  // ------------------------------------------------------------

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#FAF8F6]">
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

      <main className="flex-1 px-6 py-6">
        {isMounted && (
          <p className="mb-5 text-lg font-semibold text-[#9E7654]">
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
        open={isTodoModalOpen}
        onOpenChange={(open) => {
          setIsTodoModalOpen(open);
          if (!open) setEditingTodoId(null);
        }}
        isEditing={editingTodoId !== null}
        onSubmit={handleSubmitTodo(onSubmitTodo)}
        register={registerTodo}
        errors={todoErrors}
      />

      {/* 予定追加・編集用のModal */}
      <ScheduleFormModal
        open={isScheduleModalOpen}
        onOpenChange={(open) => {
          setIsScheduleModalOpen(open);
          if (!open) setEditingScheduleId(null);
        }}
        isEditing={editingScheduleId !== null}
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

      {/* ペット切り替え用のModal（2匹以上の場合に表示）
      現時点ではMOCK_PET_LISTを使用。複数ペット取得APIの仕様確定後、
      GET /api/pets相当のレスポンスをpetListにセットするだけで完成する設計 */}
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