"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/common/Header";
import { BottomNavigation } from "@/components/common/BottomNavigation";
import { EmergencyCallButton } from "@/components/common/EmergencyCallButton";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { TodoCard } from "./_components/TodoCard";
import { apiFetch, ApiError } from "@/lib/api-client";

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

// ▼▼▼ 動作確認用モックデータ（ステップ2：静的UI構築用） ▼▼▼
// バックエンド接続後、このブロックと下記useEffect内の切り替えは必ず削除し、
// 元のapiFetch呼び出しのみに戻すこと
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

const MOCK_TODOS: Todo[] = [
  {
    id: "todo-1",
    pet_id: "mock-pet-id",
    task_name: "朝ごはん　7時",
    is_completed: true,
    completed_by_id: "mock-profile-id",
    completed_at: "2026-06-24T08:00:00.000Z",
    todo_date: "2026-06-24",
    created_at: "2026-06-24T07:00:00.000Z",
  },
  {
    id: "todo-2",
    pet_id: "mock-pet-id",
    task_name: "フィラリア薬（朝食後）",
    is_completed: false,
    completed_by_id: null,
    completed_at: null,
    todo_date: "2026-06-24",
    created_at: "2026-06-24T07:00:00.000Z",
  },
  {
    id: "todo-3",
    pet_id: "mock-pet-id",
    task_name: "お散歩　8時半",
    is_completed: false,
    completed_by_id: null,
    completed_at: null,
    todo_date: "2026-06-24",
    created_at: "2026-06-24T07:00:00.000Z",
  },
];
// ▲▲▲ 動作確認用モックデータここまで ▲▲▲

// ▼ 動作確認用フラグ：バックエンド接続後は false に変更、または関連コードを削除すること
const USE_MOCK_DATA = true;

function formatDateLabel(date: Date): string {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  return `${year}年${month}月${day}日（${weekday}）`;
}

export default function CareHomePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [pet, setPet] = useState<Pet | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ★追加：ToDoのチェック状態を切り替える処理
  // 本来はPATCH /api/todos/:todoIdを呼ぶ必要があるが、バックエンド未接続のため
  // 現時点ではフロント側のstateのみを更新する（バックエンド接続後にAPI呼び出しを追加する）
  const handleToggleTodo = (todoId: string) => {
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

  useEffect(() => {
    // ★追加：ステップ1（データ取得の土台作り）
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
        setTodos(MOCK_TODOS);
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

  useEffect(() => {
    // マウント完了をフラグで示すだけにする（cascading render警告を回避）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

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

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#FAF8F6]">
      <Header
        petName={pet?.name}
        dateLabel={isMounted ? formatDateLabel(new Date()) : undefined}
        onPetSwitch={() => {
          // TODO: 複数ペット一覧取得APIの仕様確定後に実装（バックエンドチームに確認依頼中）
        }}
        rightSlot={
          pet?.hospital_phone ? (
            <EmergencyCallButton phoneNumber={pet.hospital_phone} />
          ) : undefined
        }
      />

      <main className="flex-1 px-6 py-6">
        {/* ★追加：今日のお世話ToDoチェックリスト */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[#6E5849]">
            今日のお世話
          </h2>
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
                />
              ))}
            </div>
          )}
        </section>

        {/* TODO：今後の予定一覧のUIをここに追加 */}
      </main>

      {/* ★追加：画面下部の共通ナビゲーション */}
      <BottomNavigation />
    </div>
  );
}