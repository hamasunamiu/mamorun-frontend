"use client";
import { useState, useEffect } from "react";
import { Users, PawPrint, Dog, Cat, Crown, CircleCheck } from "lucide-react";
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
      <main className="mx-auto flex min-h-screen w-full max-w-[430px] items-center justify-center bg-[#FFF9F5]">
        <LoadingSpinner size="lg" />
      </main>
    );
  }

  if (loadError || !stats) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[430px] items-center justify-center bg-[#FFF9F5] px-6">
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
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-[#FFF9F5]">
      <Header
        title="管理画面"
        rightSlot={
          <span className="bg-[#712B13] text-white text-xs font-medium px-3 py-1 rounded-full">
            管理者
          </span>
        }
      />
      <div className="p-4 flex flex-col gap-3">
        <div
          data-testid="ui006-stats-card"
          className="bg-white rounded-2xl border border-[#e0d6ce] p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-[#FAECE7] rounded-xl flex items-center justify-center">
              <Users size={20} color="#993C1D" strokeWidth={1} />
            </div>
            <span className="text-sm text-gray-500">総ユーザー数</span>
          </div>
          <p className="text-4xl font-medium text-[#D85A30]">
            {stats.total_users}{" "}
            <span className="text-base text-[#993C1D]">人</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-[#FAECE7] rounded-xl flex items-center justify-center">
              <PawPrint size={20} color="#993C1D" strokeWidth={1} />
            </div>
            <span className="text-sm text-gray-500">登録ペット数</span>
          </div>
          <p className="text-4xl font-medium text-[#D85A30] mb-3">
            {stats.total_pets}{" "}
            <span className="text-base text-[#993C1D]">匹</span>
          </p>
          <div className="flex gap-2">
            <div className="flex-1 bg-[#FFF9F5] rounded-lg px-3 py-2 flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <Dog size={16} color="#993C1D" strokeWidth={1} /> 犬
              </span>
              <span className="font-medium text-[#D85A30]">
                {stats.pets_by_species.dog ?? 0}匹
              </span>
            </div>
            <div className="flex-1 bg-[#FFF9F5] rounded-lg px-3 py-2 flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <Cat size={16} color="#993C1D" strokeWidth={1} /> 猫
              </span>
              <span className="font-medium text-[#D85A30]">
                {stats.pets_by_species.cat ?? 0}匹
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-[#FAECE7] rounded-xl flex items-center justify-center">
              <Crown size={20} color="#993C1D" strokeWidth={1} />
            </div>
            <span className="text-sm text-gray-500">プレミアム会員数</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-4xl font-medium text-[#D85A30]">
              {stats.premium_users}{" "}
              <span className="text-base text-[#993C1D]">人</span>
            </p>
            <span className="bg-[#FAECE7] text-[#993C1D] text-sm font-medium px-3 py-1 rounded-full">
              有料率 {premiumRate}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-[#FAECE7] rounded-xl flex items-center justify-center">
              <CircleCheck size={20} color="#993C1D" strokeWidth={1} />
            </div>
            <span className="text-sm text-gray-500">本日のToDo達成状況</span>
          </div>
          <p className="text-4xl font-medium text-[#D85A30]">
            {stats.completed_todos_today} / {stats.total_todos_today}{" "}
            <span className="text-base text-[#993C1D]">件</span>
          </p>
        </div>

        <PrimaryButton
          className="w-full border border-[#e0d6ce] bg-transparent text-gray-500 hover:bg-gray-50"
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
              className="flex-1 py-2 rounded-lg border border-[#e0d6ce] text-sm text-gray-500"
              onClick={() => setIsLogoutModalOpen(false)}
            >
              キャンセル
            </button>
            <PrimaryButton
              className="flex-1 bg-[#D85A30] hover:bg-[#D85A30] hover:opacity-85"
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
