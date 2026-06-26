"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/common/Header";
import { BottomNavigation } from "@/components/common/BottomNavigation";
import { EmergencyCallButton } from "@/components/common/EmergencyCallButton";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { apiFetch, ApiError } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import { TodoCard } from "./_components/TodoCard";
import { ScheduleCard } from "./_components/ScheduleCard";
import { formatDateLabel, formatDaysUntil } from "@/lib/dateFormat";
import type { Profile, Pet, Todo, Schedule } from "./_components/types";
import {
  MOCK_PROFILE,
  MOCK_PET,
  MOCK_PET_LIST,
  MOCK_TODOS,
  MOCK_SCHEDULES,
} from "./_components/mockData";
import { PetSwitchModal } from "./_components/PetSwitchModal";
import { DeleteConfirmModal } from "./_components/DeleteConfirmModal";
import { TodoFormModal } from "./_components/TodoFormModal";
import { ScheduleFormModal } from "./_components/ScheduleFormModal";

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

// ▼ 動作確認用フラグ：バックエンド接続後は false に変更、または関連コードを削除すること
const USE_MOCK_DATA = true;

export default function CareHomePage() {
  const router = useRouter();

  // ------------------------------------------------------------
  // state
  // ------------------------------------------------------------
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [pet, setPet] = useState<Pet | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(
    null
  );
  const [isPetSwitchModalOpen, setIsPetSwitchModalOpen] = useState(false);
  const [petList, setPetList] = useState<Pet[]>([]);

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
  // データ取得（ステップ1：土台作り）
  // ------------------------------------------------------------

  useEffect(() => {
    // ① GET /api/profiles/me で pet_id を取得
    // ② pet_id が null の場合（DB設計書の「状態B：未ペアリング」）は UI-001 へリダイレクト
    //    本来は Next.js Middleware が担う想定だが、未実装の可能性も考慮しこの画面側でも軽くガードする
    // ③ pet_id がある場合は GET /api/pets/:petId でペット情報・病院電話番号を取得
    const fetchInitialData = async () => {
      setIsLoading(true);
      setLoadError(null);

      // ▼▼▼ 動作確認用：バックエンド未接続のため一時的にモックデータを使用 ▼▼▼
      // バックエンド接続後、この if ブロックを削除し、下のコメントアウトを元に戻すこと
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 300)); // ローディング表示の確認用に少し待たせる
        setProfile(MOCK_PROFILE);
        setPet(MOCK_PET);
        setPetList(MOCK_PET_LIST);
        setTodos(MOCK_TODOS);
        setSchedules(MOCK_SCHEDULES);
        setIsLoading(false);
        return;
      }
      // ▲▲▲ 動作確認用ここまで ▲▲▲

      try {
        const profileData = await apiFetch<Profile>("/api/profiles/me");
        setProfile(profileData);

        if (!profileData.pet_id) {
          // 未ペアリング状態：お世話ホームを表示する前提が崩れるため初期登録画面へ
          router.push("/login");
          return;
        }

        const petData = await apiFetch<Pet>(`/api/pets/${profileData.pet_id}`);
        setPet(petData);
      } catch (err) {
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "データの取得に失敗しました。時間をおいて再度お試しください。"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [router]);

  // ------------------------------------------------------------
  // マウント完了フラグ（ハイドレーションミスマッチ対策）
  // ------------------------------------------------------------

  useEffect(() => {
    // マウント完了をフラグで示すだけにする（cascading render警告を回避）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // ------------------------------------------------------------
  // Supabase Realtime：todosテーブルの変更を監視
  // ------------------------------------------------------------

  useEffect(() => {
    // ★【最重要】バックエンドからの指示通り、変更通知を受け取った際は再fetchせず、
    // payload.new / payload.old を使ってstateを直接更新する（再fetchはキャッシュ競合の原因になるため禁止）。
    // pet.idが確定する前にフィルタを組み立てると意味のないチャンネルになるため、
    // pet?.id が存在する場合のみリスナーを登録する。
    if (!pet?.id) return;

    const channel = supabase
      .channel(`todos-changes-${pet.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "todos",
          filter: `pet_id=eq.${pet.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newTodo = payload.new as Todo;
            setTodos((prevTodos) => {
              // 同じIDが既に存在する場合は重複追加しない（自分自身の操作分との重複防止）
              if (prevTodos.some((todo) => todo.id === newTodo.id)) {
                return prevTodos;
              }
              return [...prevTodos, newTodo];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedTodo = payload.new as Todo;
            setTodos((prevTodos) =>
              prevTodos.map((todo) =>
                todo.id === updatedTodo.id ? updatedTodo : todo
              )
            );
          } else if (payload.eventType === "DELETE") {
            const deletedTodo = payload.old as Todo;
            setTodos((prevTodos) =>
              prevTodos.filter((todo) => todo.id !== deletedTodo.id)
            );
          }
        }
      )
      .subscribe();

    // ★重要：コンポーネントが画面から消える時（クリーンアップ時）に、
    // 必ずチャンネルの登録を解除する。これを忘れると、画面を何度も開閉した際に
    // 同じイベントを複数回受け取ってしまう不具合の原因になる
    return () => {
      supabase.removeChannel(channel);
    };
  }, [pet?.id]);

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
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-md font-semibold text-[#6E5849]">
              🐾 今日のお世話
            </h2>
            <button
              type="button"
              onClick={() => {
                setEditingTodoId(null);
                resetTodoForm({ taskName: "" });
                setIsTodoModalOpen(true);
              }}
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
                  taskName={todo.task_name}
                  isCompleted={todo.is_completed}
                  completedById={todo.completed_by_id}
                  onToggle={() => handleToggleTodo(todo.id)}
                  onDelete={() =>
                    setDeleteTarget({
                      type: "todo",
                      id: todo.id,
                      name: todo.task_name,
                    })
                  }
                  onEdit={() => handleStartEditTodo(todo)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 今後の予定一覧 */}
        <section className="mt-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-md font-semibold text-[#6E5849]">
              🗓️ 今後の予定
            </h2>
            <button
              type="button"
              onClick={() => {
                setEditingScheduleId(null);
                resetScheduleForm({
                  title: "",
                  scheduledContent: "",
                  scheduledDate: "",
                });
                setIsScheduleModalOpen(true);
              }}
              className="flex min-h-11 items-center gap-1 rounded-lg border border-[#D8C0A8] px-2.5 text-xs font-bold text-[#993C1D]"
            >
              予定を追加
            </button>
          </div>

          {schedules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              今後の予定はまだ登録されていません
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {schedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  title={schedule.title}
                  content={schedule.scheduled_content}
                  // isMountedガード：マウント前（サーバー側プリレンダリング時）は
                  // new Date()を使わず空文字にし、ハイドレーションミスマッチを防ぐ
                  daysUntilLabel={
                    isMounted
                      ? formatDaysUntil(schedule.scheduled_date, new Date())
                      : ""
                  }
                  isCompleted={schedule.is_completed}
                  onToggle={() => handleToggleSchedule(schedule.id)}
                  onDelete={() =>
                    setDeleteTarget({
                      type: "schedule",
                      id: schedule.id,
                      name: schedule.title,
                    })
                  }
                  onEdit={() => handleStartEditSchedule(schedule)}
                />
              ))}
            </div>
          )}
        </section>
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
        currentPetId={pet?.id}onSwitch={handleSwitchPet}
      />

      {/* 画面下部の共通ナビゲーション */}
      <BottomNavigation />
    </div>
  );
}