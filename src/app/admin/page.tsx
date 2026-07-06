"use client";
import { useState, useEffect } from "react";
import { Users, PawPrint, Dog, Cat, Crown } from "lucide-react";
import { Header } from "@/components/common/Header";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { Modal } from "@/components/common/Modal";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { supabase } from "@/lib/supabase";
import { apiFetch, ApiError } from "@/lib/api-client";

type AdminStats = {
  total_users: number;
  total_pets: number;
  pets_by_species: Record<string, number>;
  premium_users: number;
  total_todos_today: number;
  completed_todos_today: number;
};

export default function AdminPage() {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch<AdminStats>("/api/admin/stats");
        setStats(data);
      } catch (err) {
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "統計情報の取得に失敗しました。時間をおいて再度お試しください。",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
    setIsLogoutModalOpen(false);
  };

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[430px] items-center justify-center bg-[#FAF8F6]">
        <LoadingSpinner size="lg" />
      </main>
    );
  }

  if (loadError || !stats) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[430px] items-center justify-center bg-[#FAF8F6] px-6">
        <ErrorMessage
          message={loadError ?? "統計情報を取得できませんでした。"}
        />
      </main>
    );
  }

  const premiumRate =
    stats.total_users > 0
      ? Math.round((stats.premium_users / stats.total_users) * 100)
      : 0;

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#FAF8F6]">
      <Header
        title="管理画面"
        rightSlot={
          <span className="bg-[#D85A30] text-white text-md font-medium px-3 py-1 rounded-full">
            管理者
          </span>
        }
      />
      <div className="p-4 flex flex-col gap-3">
        <div
          data-testid="ui006-stats-card"
          className="bg-white rounded-2xl p-4"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center text-accent-foreground">
              <Users size={20} strokeWidth={2} />
            </div>
            <span className="text-md font-bold text-accent-foreground">
              総ユーザー数
            </span>
          </div>
          <p className="text-4xl font-medium text-[#6E5849]">
            {stats.total_users}{" "}
            <span className="text-base text-[#6E5849]">人</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center text-accent-foreground">
              <PawPrint size={20} strokeWidth={2} />
            </div>
            <span className="text-md font-bold text-accent-foreground">
              登録ペット数
            </span>
          </div>
          <p className="text-4xl font-medium text-[#6E5849] mb-3">
            {stats.total_pets}{" "}
            <span className="text-base text-[#6E5849]">匹</span>
          </p>
          <div className="flex gap-10 justify-center">
            <div className="flex-1 max-w-[40%] bg-accent rounded-lg px-2 py-2 flex justify-between text-sm">
              <span className="flex items-center gap-1 font-bold text-accent-foreground">
                <Dog size={16} strokeWidth={2} /> 犬
              </span>
              <span className="font-medium text-[#6E5849]">
                {stats.pets_by_species.dog ?? 0}匹
              </span>
            </div>
            <div className="flex-1 max-w-[40%] bg-accent rounded-lg px-2 py-2 flex justify-between text-sm">
              <span className="flex items-center gap-1 font-bold text-accent-foreground">
                <Cat size={16} strokeWidth={2} /> 猫
              </span>
              <span className="font-medium text-[#6E5849]">
                {stats.pets_by_species.cat ?? 0}匹
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center text-accent-foreground">
              <Crown size={20} strokeWidth={2} />
            </div>
            <span className="text-md font-bold text-accent-foreground">
              プレミアム会員数
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-4xl font-medium text-[#6E5849]">
              {stats.premium_users}{" "}
              <span className="text-base text-[#6E5849]">人</span>
            </p>
            <span className="bg-accent text-accent-foreground text-sm font-medium px-3 py-1 rounded-full">
              有料率 {premiumRate}%
            </span>
          </div>
        </div>

        <PrimaryButton
          className="w-full h-12 bg-primary text-white hover:opacity-85"
          onClick={() => setIsLogoutModalOpen(true)}
        >
          ログアウト
        </PrimaryButton>
      </div>

      {/* ログアウト確認モーダル */}
      <Modal
        open={isLogoutModalOpen}
        onOpenChange={(open) => setIsLogoutModalOpen(open)}
        title="ログアウトしますか？"
        footer={
          <div className="flex gap-2 w-full">
            <button
              className="h-11 flex-1 rounded-2xl border border-border text-sm font-medium text-foreground"
              onClick={() => setIsLogoutModalOpen(false)}
            >
              キャンセル
            </button>
            <PrimaryButton
              className="flex-1 h-11 rounded-2xl"
              onClick={handleLogout}
            >
              ログアウト
            </PrimaryButton>
          </div>
        }
      />
    </div>
  );
}
