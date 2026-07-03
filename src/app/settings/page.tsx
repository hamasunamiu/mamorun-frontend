"use client";
import { Suspense, useState, useEffect } from "react";
import {
  User,
  PawPrint,
  PenLine,
  Plus,
  Users,
  Star,
  Crown,
  Smartphone,
  Bell,
} from "lucide-react";
import { Header } from "@/components/common/Header";
import { BottomNavigation } from "@/components/common/BottomNavigation";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { Modal } from "@/components/common/Modal";
import { supabase } from "@/lib/supabase";
import { PetEditModal } from "@/components/settings/PetEditModal";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useSearchParams } from "next/navigation";

type Profile = {
  id: string;
  is_premium: boolean;
  line_user_id: string | null;
  pet_id: string | null;
  notification_time: "morning" | "night";
};

type Pet = {
  id: string;
  name: string;
  species: "dog" | "cat";
  gender: "male" | "female";
  birthday: string;
  illness?: string;
};

function SettingsPageContent() {
  const [notificationTime, setNotificationTime] = useState<"morning" | "night">(
    "morning",
  );
  const [isPremium, setIsPremium] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isLineLinked, setIsLineLinked] = useState(false);
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [isPetEditModalOpen, setIsPetEditModalOpen] = useState(false);
  const [currentPet, setCurrentPet] = useState<Pet | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLineUnlinkModalOpen, setIsLineUnlinkModalOpen] = useState(false);
  const [isPremiumCancelModalOpen, setIsPremiumCancelModalOpen] =
    useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      setEmail(session.user.email ?? null);

      try {
        const profile = await apiFetch<Profile>("/api/profiles/me");
        setIsPremium(profile.is_premium);
        setIsLineLinked(!!profile.line_user_id);
        setNotificationTime(profile.notification_time ?? "morning");

        if (profile.pet_id) {
          const petData = await apiFetch<Pet>(`/api/pets/${profile.pet_id}`);
          setCurrentPet(petData);
        }
      } catch (err) {
        console.error("プロフィール取得失敗:", err);
      }
    };

    fetchProfile();
  }, [searchParams]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
    setIsLogoutModalOpen(false);
  };

  const handleCreateInvite = async () => {
    if (!currentPet?.id || isInviting) return;
    setIsInviting(true);
    setInviteError(null);

    try {
      const data = await apiFetch<{ invite_url: string; expires_at: string }>(
        `/api/pets/${currentPet.id}/invite`,
        { method: "POST" },
      );
      setInviteUrl(data.invite_url);
    } catch (err) {
      setInviteError(
        err instanceof ApiError ? err.message : "招待URLの発行に失敗しました。",
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpgrade = async () => {
    if (isUpgrading) return;
    setIsUpgrading(true);

    try {
      const result = await apiFetch<{ url: string }>("/api/stripe/checkout", {
        method: "POST",
      });
      if (result.url) {
        window.location.href = result.url;
      } else {
        setIsUpgrading(false);
      }
    } catch (err) {
      console.error("アップグレード失敗:", err);
      setIsUpgrading(false);
    }
  };

  const handleLineLink = async () => {
    const lineUserId = prompt(
      "LINE IDを入力してください（例：Uxxxxxxxxxxxxxxxx）",
    );
    if (!lineUserId) return;

    try {
      await apiFetch("/api/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ line_user_id: lineUserId }),
      });
      setIsLineLinked(true);
    } catch (err) {
      alert("LINE連携に失敗しました。");
    }
  };

  const handleLineUnlink = async () => {
    try {
      await apiFetch("/api/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ line_user_id: null }),
      });
      setIsLineLinked(false);
      setIsLineUnlinkModalOpen(false);
    } catch (err) {
      alert("LINE連携の解除に失敗しました。");
    }
  };

  const handlePremiumCancel = async () => {
    try {
      await apiFetch("/api/stripe/cancel", { method: "POST" });
      setIsPremium(false);
      setIsPremiumCancelModalOpen(false);
    } catch (err) {
      alert("解約処理に失敗しました。");
    }
  };

  const handleSaveNotificationTime = async () => {
    try {
      await apiFetch("/api/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ notification_time: notificationTime }),
      });
      alert("通知時間を保存しました！");
    } catch (err) {
      alert("通知時間の保存に失敗しました。");
    }
  };

  const handleSendLineTest = async () => {
    try {
      await apiFetch("/api/notifications/line/remind", { method: "POST" });
      alert("LINEを送信しました！");
    } catch (err) {
      alert("LINEの送信に失敗しました。");
    }
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#FAF8F6]">
      <Header title="設定" />

      <div className="p-4 flex flex-col gap-3">
        {/* アカウント情報 */}
        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-[#993C1D] mb-3">
            <User size={14} color="#993C1D" strokeWidth={1} />
            アカウント情報
          </p>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-gray-500">メールアドレス</span>
            <span className="text-xs text-gray-700">
              {email ?? "読み込み中..."}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-gray-500">プラン</span>
            {isPremium ? (
              <span
                data-testid="ui005-premium-badge"
                className="bg-[#FAECE7] border border-[#D85A30] text-[#993C1D] text-xs font-medium px-3 py-1 rounded-full"
              >
                プレミアムプラン
              </span>
            ) : (
              <span className="bg-[#f0ece8] border border-[#e0d6ce] text-[#888780] text-xs font-medium px-3 py-1 rounded-full">
                無料プラン
              </span>
            )}
          </div>
        </div>

        {/* ペット情報 */}
        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-[#993C1D] mb-3">
            <PawPrint size={14} color="#993C1D" strokeWidth={1} />
            ペット情報
          </p>
          <button
            className="flex items-center justify-between py-1 w-full"
            onClick={() => setIsPetEditModalOpen(true)}
          >
            <div className="flex items-center gap-3 text-sm text-gray-800">
              <div className="w-8 h-8 bg-[#FAECE7] rounded-lg flex items-center justify-center">
                <PenLine size={16} color="#993C1D" strokeWidth={1} />
              </div>
              ペット情報を編集する
            </div>
            <span className="text-gray-400">›</span>
          </button>
          <div className="border-t border-[#f0ece8] my-2" />
          <button
            className="flex items-center justify-between py-1 w-full"
            onClick={() => setIsPetModalOpen(true)}
          >
            <div className="flex items-center gap-3 text-sm text-gray-800">
              <div className="w-8 h-8 bg-[#FAECE7] rounded-lg flex items-center justify-center">
                <Plus size={16} color="#993C1D" strokeWidth={1} />
              </div>
              新しいペットを追加する
            </div>
            <span className="text-gray-400">›</span>
          </button>
        </div>

        {/* 家族を招待する */}
        <div
          data-testid="ui005-invite-button"
          className="bg-white rounded-2xl border border-[#e0d6ce] p-4 cursor-pointer"
          onClick={() => setIsInviteModalOpen(true)}
        >
          <p className="flex items-center gap-1.5 text-xs font-medium text-[#993C1D] mb-3">
            <Users size={14} color="#993C1D" strokeWidth={1} />
            家族を招待する
          </p>
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3 text-sm text-gray-800">
              <div className="w-8 h-8 bg-[#FAECE7] rounded-lg flex items-center justify-center">
                <Users size={16} color="#993C1D" strokeWidth={1} />
              </div>
              招待URLを発行する
            </div>
            <span className="text-gray-400">›</span>
          </div>
        </div>

        {/* プレミアムプラン（LINE連携・通知設定・解約含む） */}
        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-[#993C1D] mb-3">
            <Star size={14} color="#993C1D" strokeWidth={1} />
            プレミアムプラン
          </p>
          <p className="text-sm text-gray-500 leading-relaxed mb-3">
            AI相談が無制限・LINE通知が使えるようになります。月額500円（税込）
          </p>

          {!isPremium && (
            <PrimaryButton
              data-testid="ui005-premium-button"
              className="w-full bg-[#D85A30] hover:bg-[#D85A30] hover:opacity-85 mb-3"
              onClick={handleUpgrade}
              disabled={isUpgrading}
            >
              <span className="flex items-center justify-center gap-1">
                <Crown size={14} color="#ffffff" strokeWidth={1} />
                {isUpgrading ? "処理中..." : "プレミアムにアップグレード"}
              </span>
            </PrimaryButton>
          )}

          <div
            className={`flex flex-col gap-3 ${!isPremium ? "opacity-40 pointer-events-none" : ""}`}
          >
            <div className="border-t border-[#f0e8e0] pt-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-2">
                <Smartphone size={14} color="#4b5563" strokeWidth={1} />
                LINE連携
              </p>
              {isLineLinked ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    {/* ★シークレットボタン：この文字自体をタップするとLINEテスト送信が実行される */}
                    <button
                      className="text-xs text-green-600 bg-transparent border-none p-0 cursor-pointer"
                      onClick={handleSendLineTest}
                    >
                      連携済み
                    </button>
                    <button
                      className="text-xs text-gray-500 underline"
                      onClick={() => setIsLineUnlinkModalOpen(true)}
                    >
                      連携解除
                    </button>
                  </div>
                </div>
              ) : (
                <PrimaryButton
                  className="w-full bg-[#06C755] hover:bg-[#06C755] hover:opacity-85 text-white"
                  onClick={handleLineLink}
                >
                  LINEと連携する
                </PrimaryButton>
              )}
            </div>

            {isLineLinked && (
              <div className="border-t border-[#f0e8e0] pt-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-2">
                  <Bell size={14} color="#4b5563" strokeWidth={1} />
                  LINE通知タイミング
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  リマインドを受け取る時間帯
                </p>
                <div className="flex gap-2">
                  <button
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium ${
                      notificationTime === "morning"
                        ? "border-[#D85A30] bg-[#FAECE7] text-[#993C1D]"
                        : "border-[#e0d6ce] bg-[#FFF9F5] text-gray-500"
                    }`}
                    onClick={() => setNotificationTime("morning")}
                  >
                    朝（08:00）
                  </button>
                  <button
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium ${
                      notificationTime === "night"
                        ? "border-[#D85A30] bg-[#FAECE7] text-[#993C1D]"
                        : "border-[#e0d6ce] bg-[#FFF9F5] text-gray-500"
                    }`}
                    onClick={() => setNotificationTime("night")}
                  >
                    夜（20:00）
                  </button>
                </div>
                <PrimaryButton
                  className="w-full bg-[#D85A30] hover:bg-[#D85A30] hover:opacity-85 mt-2"
                  onClick={handleSaveNotificationTime}
                >
                  通知時間を保存する
                </PrimaryButton>
              </div>
            )}

            {isPremium && (
              <div className="border-t border-[#f0e8e0] pt-3">
                <button
                  className="text-xs text-gray-500 underline"
                  onClick={() => setIsPremiumCancelModalOpen(true)}
                >
                  プレミアムプランを解約する
                </button>
              </div>
            )}
          </div>
        </div>

        <PrimaryButton
          className="w-full border border-[#e0d6ce] bg-transparent text-gray-500 hover:bg-gray-50"
          onClick={() => setIsLogoutModalOpen(true)}
        >
          ログアウト
        </PrimaryButton>
      </div>

      <Modal
        open={isInviteModalOpen}
        onOpenChange={(open) => {
          setIsInviteModalOpen(open);
          if (!open) {
            setInviteUrl(null);
            setInviteError(null);
          }
        }}
        title="家族を招待する"
        description="招待URLを発行して家族と共有しましょう。"
        footer={
          inviteUrl ? (
            <div className="flex flex-col gap-2 w-full">
              <input
                data-testid="ui005-invite-url-text"
                readOnly
                value={inviteUrl}
                className="text-xs border border-[#e0d6ce] rounded-lg px-3 py-2 bg-[#FFF9F5]"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                className="flex-1 py-2 rounded-lg border border-[#e0d6ce] text-sm text-gray-500"
                onClick={() => setIsInviteModalOpen(false)}
              >
                閉じる
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              {inviteError && (
                <p className="text-xs text-red-500 text-center">
                  {inviteError}
                </p>
              )}
              <div className="flex gap-2 w-full">
                <button
                  className="flex-1 py-2 rounded-lg border border-[#e0d6ce] text-sm text-gray-500"
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  閉じる
                </button>
                <PrimaryButton
                  data-testid="ui005-invite-generate-button"
                  className="flex-1 bg-[#D85A30] hover:bg-[#D85A30] hover:opacity-85"
                  onClick={handleCreateInvite}
                  disabled={isInviting}
                >
                  {isInviting ? "発行中..." : "URLを発行する"}
                </PrimaryButton>
              </div>
            </div>
          )
        }
      />

      <Modal
        open={isLineUnlinkModalOpen}
        onOpenChange={(open) => setIsLineUnlinkModalOpen(open)}
        title="LINE連携を解除しますか？"
        description="解除するとLINE通知が届かなくなります。"
        footer={
          <div className="flex gap-2 w-full">
            <button
              className="flex-1 py-2 rounded-lg border border-[#e0d6ce] text-sm text-gray-500"
              onClick={() => setIsLineUnlinkModalOpen(false)}
            >
              キャンセル
            </button>
            <PrimaryButton
              className="flex-1 bg-red-500 hover:bg-red-500 hover:opacity-85"
              onClick={handleLineUnlink}
            >
              解除する
            </PrimaryButton>
          </div>
        }
      />

      <Modal
        open={isPremiumCancelModalOpen}
        onOpenChange={(open) => setIsPremiumCancelModalOpen(open)}
        title="プレミアムプランを解約しますか？"
        description="解約するとLINE通知・AI無制限が使えなくなります。"
        footer={
          <div className="flex gap-2 w-full">
            <button
              className="flex-1 py-2 rounded-lg border border-[#e0d6ce] text-sm text-gray-500"
              onClick={() => setIsPremiumCancelModalOpen(false)}
            >
              キャンセル
            </button>
            <PrimaryButton
              className="flex-1 bg-red-500 hover:bg-red-500 hover:opacity-85"
              onClick={handlePremiumCancel}
            >
              解約する
            </PrimaryButton>
          </div>
        }
      />

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

      <PetEditModal
        open={isPetEditModalOpen}
        onOpenChange={setIsPetEditModalOpen}
        mode="edit"
        pet={currentPet}
        onSaved={async () => {
          if (currentPet?.id) {
            try {
              const petData = await apiFetch<Pet>(`/api/pets/${currentPet.id}`);
              setCurrentPet(petData);
            } catch (err) {
              console.error("ペット情報の再取得に失敗:", err);
            }
          }
        }}
      />

      <PetEditModal
        open={isPetModalOpen}
        onOpenChange={setIsPetModalOpen}
        mode="add"
        onSaved={() => {}}
      />

      <div className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[430px]">
        <BottomNavigation />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <SettingsPageContent />
    </Suspense>
  );
}
