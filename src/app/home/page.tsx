"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/common/Header";
import { BottomNavigation } from "@/components/common/BottomNavigation";
import { EmergencyCallButton } from "@/components/common/EmergencyCallButton";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
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

  // ※ 現時点ではpet_idの判定にのみ使用しJSXでは未使用だが、
  // notification_time・line_user_id等を今後の機能（UI-005設定画面連携等）で使う予定のため保持する
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
        {/* TODO：ステップ2でToDo一覧・予定一覧のUIをここに追加 */}
      </main>

      {/* ★追加：画面下部の共通ナビゲーション */}
      <BottomNavigation />
    </div>
  );
}