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
import { Modal } from "@/components/common/Modal";
import { InputField } from "@/components/common/InputField";
import { TextAreaField } from "@/components/common/TextAreaField";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { apiFetch, ApiError } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import { TodoCard } from "./_components/TodoCard";
import { ScheduleCard } from "./_components/ScheduleCard";

// ============================================================
// 型定義（API設計書のレスポンス例に準拠）
// ============================================================

type Profile = {
  id: string;
  line_user_id: string | null;
  is_premium: boolean;
  stripe_customer_id: string | null;
  pet_id: string | null;
  notification_time: "morning" | "night";
  created_at: string;
};

type Pet = {
  id: string;
  name: string;
  species: "dog" | "cat";
  gender: "male" | "female" | null;
  birthday: string | null;
  illness: string | null;
  hospital_name: string | null;
  hospital_phone: string | null;
  hospital_address: string | null;
  hospital_card_image_url: string | null;
  insurance_card_image_url: string | null;
  created_at: string;
};

type Todo = {
  id: string;
  pet_id: string;
  task_name: string;
  is_completed: boolean;
  completed_by_id: string | null;
  completed_at: string | null;
  todo_date: string;
  created_at: string;
};

type Schedule = {
  id: string;
  pet_id: string;
  title: string;
  scheduled_content: string | null;
  scheduled_date: string;
  is_completed: boolean;
  created_at: string;
};

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

// ============================================================
// 動作確認用モックデータ
// ▼▼▼ バックエンド接続後、このブロックと下記useEffect内の切り替えは必ず削除し、
//     元のapiFetch呼び出しのみに戻すこと ▼▼▼
// ============================================================

const MOCK_PROFILE: Profile = {
  id: "mock-profile-id",
  line_user_id: null,
  is_premium: false,
  stripe_customer_id: null,
  pet_id: "mock-pet-id",
  notification_time: "morning",
  created_at: "2026-06-01T00:00:00.000Z",
};

const MOCK_PET: Pet = {
  id: "mock-pet-id",
  name: "むぎ",
  species: "dog",
  gender: "male",
  birthday: "2023-04-01",
  illness: "アレルギー性皮膚炎",
  hospital_name: "〇〇動物病院",
  hospital_phone: "0312345678",
  hospital_address: "東京都渋谷区...",
  hospital_card_image_url: null,
  insurance_card_image_url: null,
  created_at: "2026-06-01T00:00:00.000Z",
};

const MOCK_PET_LIST: Pet[] = [
  MOCK_PET,
  {
    id: "mock-pet-id-2",
    name: "もも",
    species: "cat",
    gender: "female",
    birthday: "2022-09-10",
    illness: null,
    hospital_name: "〇〇動物病院",
    hospital_phone: "0312345678",
    hospital_address: "東京都渋谷区...",
    hospital_card_image_url: null,
    insurance_card_image_url: null,
    created_at: "2026-06-01T00:00:00.000Z",
  },
];

const MOCK_TODOS: Todo[] = [
  {
    id: "todo-1",
    pet_id: "mock-pet-id",
    task_name: "朝ごはん　7時",
    is_completed: true,
    completed_by_id: "mock-profile-id",
    completed_at: "2026-06-24T07:00:00.000Z",
    todo_date: "2026-06-24",
    created_at: "2026-06-24T07:00:00.000Z",
  },
  {
    id: "todo-2",
    pet_id: "mock-pet-id",
    task_name: "お散歩　8時半",
    is_completed: false,
    completed_by_id: null,
    completed_at: null,
    todo_date: "2026-06-24",
    created_at: "2026-06-24T07:00:00.000Z",
  },
  {
    id: "todo-3",
    pet_id: "mock-pet-id",
    task_name: "目薬（お散歩の後）",
    is_completed: false,
    completed_by_id: null,
    completed_at: null,
    todo_date: "2026-06-24",
    created_at: "2026-06-24T07:00:00.000Z",
  },
];

const MOCK_SCHEDULES: Schedule[] = [
  {
    id: "schedule-1",
    pet_id: "mock-pet-id",
    title: "狂犬病ワクチン",
    scheduled_content: null,
    scheduled_date: "2026-07-01",
    is_completed: false,
    created_at: "2025-07-01T00:00:00.000Z",
  },
  {
    id: "schedule-2",
    pet_id: "mock-pet-id",
    title: "フィラリア薬",
    scheduled_content: "毎月15日に投与。体重5kgのため1錠。",
    scheduled_date: "2026-07-15",
    is_completed: false,
    created_at: "2026-06-15T00:00:00.000Z",
  },
];

// ▲▲▲ 動作確認用モックデータここまで ▲▲▲

// ▼ 動作確認用フラグ：バックエンド接続後は false に変更、または関連コードを削除すること
const USE_MOCK_DATA = true;

// ============================================================
// 表示専用のフォーマット関数
// （クライアント側でのみ呼び出すこと。isMountedガードと組み合わせて使用する）
// ============================================================

function formatDateLabel(date: Date): string {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  return `${year}年${month}月${day}日（${weekday}）`;
}

function formatDaysUntil(scheduledDate: string, today: Date): string {
  // 時刻部分の差異で日数がズレないよう、両方を「日付のみ」に正規化して比較する
  const target = new Date(scheduledDate + "T00:00:00");
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const diffMs = target.getTime() - todayMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "今日";
  if (diffDays < 0) return "期限切れ";
  return `あと${diffDays}日`;
}

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
      <Modal
        open={isTodoModalOpen}
        onOpenChange={(open) => {
          setIsTodoModalOpen(open);
          if (!open) setEditingTodoId(null);
        }}
        title={editingTodoId ? "ToDoを編集する" : "ToDoを追加する"}
      >
        <form
          onSubmit={handleSubmitTodo(onSubmitTodo)}
          className="flex flex-col gap-4"
        >
          <InputField
            label="タスク名"
            required
            placeholder="例：朝ごはん　7時"
            {...registerTodo("taskName")}
            error={todoErrors.taskName?.message}
          />
          <PrimaryButton
            type="submit"
            className="h-12 rounded-2xl bg-[#C69A6B] hover:bg-[#C69A6B] hover:opacity-85"
          >
            {editingTodoId ? "更新する" : "追加する"}
          </PrimaryButton>
        </form>
      </Modal>

      {/* 予定追加・編集用のModal */}
      <Modal
        open={isScheduleModalOpen}
        onOpenChange={(open) => {
          setIsScheduleModalOpen(open);
          if (!open) setEditingScheduleId(null);
        }}
        title={editingScheduleId ? "予定を編集する" : "予定を追加する"}
      >
        <form
          onSubmit={handleSubmitSchedule(onSubmitSchedule)}
          className="flex flex-col gap-4"
        >
          <InputField
            label="タイトル"
            required
            placeholder="例：フィラリア薬"
            {...registerSchedule("title")}
            error={scheduleErrors.title?.message}
          />
          <TextAreaField
            label="予定内容"
            placeholder="例：毎月15日に投与"
            {...registerSchedule("scheduledContent")}
            error={scheduleErrors.scheduledContent?.message}
          />
          <InputField
            label="予定日"
            required
            type="date"
            {...registerSchedule("scheduledDate")}
            error={scheduleErrors.scheduledDate?.message}
          />
          <PrimaryButton
            type="submit"
            className="h-12 rounded-2xl bg-[#C69A6B] hover:bg-[#C69A6B] hover:opacity-85"
          >
            {editingScheduleId ? "更新する" : "追加する"}
          </PrimaryButton>
        </form>
      </Modal>

      {/* 削除確認用のModal（ToDo・予定共通） */}
      <Modal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="削除しますか？"
        description={
          deleteTarget
            ? `「${deleteTarget.name}」を削除します。この操作は取り消せません。`
            : undefined
        }
        footer={
          <div className="flex w-full gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="h-11 flex-1 rounded-2xl border border-border text-sm font-medium text-foreground"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="h-11 flex-1 rounded-2xl bg-destructive text-sm font-medium text-white"
            >
              削除する
            </button>
          </div>
        }
      />

      {/* ペット切り替え用のModal（2匹以上の場合に表示）
          現時点ではMOCK_PET_LISTを使用。複数ペット取得APIの仕様確定後、
          GET /api/pets相当のレスポンスをpetListにセットするだけで完成する設計 */}
      <Modal
        open={isPetSwitchModalOpen}
        onOpenChange={setIsPetSwitchModalOpen}
        title="ペットを切り替える"
      >
        <div className="flex flex-col gap-2">
          {petList.map((p) => {
            const isSelected = p.id === pet?.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSwitchPet(p)}
                aria-pressed={isSelected}
                className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium ${
                  isSelected
                    ? "border-[#C4956A] bg-[#FBE9DD] text-[#993C1D]"
                    : "border-border bg-background text-foreground"
                }`}
              >
                <span aria-hidden="true">
                  {p.species === "dog" ? "🐶" : "🐱"}
                </span>
                {p.name}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* 画面下部の共通ナビゲーション */}
      <BottomNavigation />
    </div>
  );
}