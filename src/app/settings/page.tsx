"use client";
import { useState, useEffect } from "react";
import { Header } from "@/components/common/Header";
import { BottomNavigation } from "@/components/common/BottomNavigation";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { Modal } from "@/components/common/Modal";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const [notificationTime, setNotificationTime] = useState<"morning" | "night">(
    "morning",
  );
  const [isPremium, setIsPremium] = useState(false);
  const [isLineLinked, setIsLineLinked] = useState(false);
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLineUnlinkModalOpen, setIsLineUnlinkModalOpen] = useState(false);
  const [isPremiumCancelModalOpen, setIsPremiumCancelModalOpen] =
    useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("http://localhost:3001/api/profiles/me", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      setIsPremium(result.data.is_premium);
      setIsLineLinked(!!result.data.line_user_id);
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
    setIsLogoutModalOpen(false);
  };

  const handleUpgrade = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch("http://localhost:3001/api/stripe/checkout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    if (result.data?.url) {
      window.location.href = result.data.url;
    }
  };

  const handleLineLink = async () => {
    const lineUserId = prompt(
      "LINE IDを入力してください（例：Uxxxxxxxxxxxxxxxx）",
    );
    if (!lineUserId) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    await fetch("http://localhost:3001/api/profiles/me", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ line_user_id: lineUserId }),
    });

    setIsLineLinked(true);
  };

  const handleLineUnlink = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    await fetch("http://localhost:3001/api/profiles/me", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ line_user_id: null }),
    });

    setIsLineLinked(false);
    setIsLineUnlinkModalOpen(false);
  };

  const handlePremiumCancel = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    await fetch("http://localhost:3001/api/stripe/cancel", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        "Content-Type": "application/json",
      },
    });

    setIsPremium(false);
    setIsPremiumCancelModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] pb-20">
      <Header title="設定" />

      <div className="p-4 flex flex-col gap-3">
        {/* アカウント情報 */}
        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <p className="text-xs font-medium text-[#993C1D] mb-3">
            👤 アカウント情報
          </p>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-gray-500">メールアドレス</span>
            <span className="text-xs text-gray-700">mano@example.com</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-gray-500">プラン</span>
            {isPremium ? (
              <span className="bg-[#FAECE7] border border-[#D85A30] text-[#993C1D] text-xs font-medium px-3 py-1 rounded-full">
                プレミアムプラン
              </span>
            ) : (
              <span className="bg-[#f0ece8] border border-[#e0d6ce] text-[#888780] text-xs font-medium px-3 py-1 rounded-full">
                無料プラン
              </span>
            )}
          </div>
        </div>

        {/* ペットを追加する */}
        <div
          className="bg-white rounded-2xl border border-[#e0d6ce] p-4 cursor-pointer"
          onClick={() => setIsPetModalOpen(true)}
        >
          <p className="text-xs font-medium text-[#993C1D] mb-3">
            🐾 ペットを追加する
          </p>
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3 text-sm text-gray-800">
              <div className="w-8 h-8 bg-[#FAECE7] rounded-lg flex items-center justify-center">
                ➕
              </div>
              新しいペットを登録する
            </div>
            <span className="text-gray-400">›</span>
          </div>
        </div>

        {/* 家族を招待する */}
        <div
          className="bg-white rounded-2xl border border-[#e0d6ce] p-4 cursor-pointer"
          onClick={() => setIsInviteModalOpen(true)}
        >
          <p className="text-xs font-medium text-[#993C1D] mb-3">
            👥 家族を招待する
          </p>
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3 text-sm text-gray-800">
              <div className="w-8 h-8 bg-[#FAECE7] rounded-lg flex items-center justify-center">
                👥
              </div>
              招待URLを発行する
            </div>
            <span className="text-gray-400">›</span>
          </div>
        </div>

        {/* プレミアムプラン（LINE連携・通知設定・解約含む） */}
        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <p className="text-xs font-medium text-[#993C1D] mb-3">
            ⭐ プレミアムプラン
          </p>
          <p className="text-sm text-gray-500 leading-relaxed mb-3">
            AI相談が無制限・LINE通知が使えるようになります。月額500円（税込）
          </p>

          {!isPremium && (
            <PrimaryButton
              className="w-full bg-[#D85A30] hover:bg-[#D85A30] hover:opacity-85 mb-3"
              onClick={handleUpgrade}
            >
              👑 プレミアムにアップグレード
            </PrimaryButton>
          )}

          <div
            className={`flex flex-col gap-3 ${!isPremium ? "opacity-40 pointer-events-none" : ""}`}
          >
            <div className="border-t border-[#f0e8e0] pt-3">
              <p className="text-xs font-medium text-gray-600 mb-2">
                📲 LINE連携
              </p>
              {isLineLinked ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-600">✅ 連携済み</span>
                    <button
                      className="text-xs text-gray-400 underline"
                      onClick={() => setIsLineUnlinkModalOpen(true)}
                    >
                      連携解除
                    </button>
                  </div>
                  <button
                    className="text-xs text-gray-400 border border-[#e0d6ce] rounded-lg py-1.5 px-3 w-full"
                    onClick={() => {
                      const sendLineTest = async () => {
                        const {
                          data: { session },
                        } = await supabase.auth.getSession();
                        await fetch(
                          "http://localhost:3001/api/notifications/line/remind",
                          {
                            method: "POST",
                            headers: {
                              Authorization: `Bearer ${session?.access_token}`,
                            },
                          },
                        );
                        alert("LINEを送信しました！");
                      };
                      sendLineTest();
                    }}
                  >
                    📨 LINEテスト送信（デモ用）
                  </button>
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
                <p className="text-xs font-medium text-gray-600 mb-2">
                  🔔 LINE通知タイミング
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
                  onClick={async () => {
                    const {
                      data: { session },
                    } = await supabase.auth.getSession();
                    await fetch("http://localhost:3001/api/profiles/me", {
                      method: "PATCH",
                      headers: {
                        Authorization: `Bearer ${session?.access_token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        notification_time: notificationTime,
                      }),
                    });
                    alert("通知時間を保存しました！");
                  }}
                >
                  通知時間を保存する
                </PrimaryButton>
              </div>
            )}

            {isPremium && (
              <div className="border-t border-[#f0e8e0] pt-3">
                <button
                  className="text-xs text-gray-400 underline"
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
        open={isPetModalOpen}
        onOpenChange={(open) => setIsPetModalOpen(open)}
        title="ペットを追加する"
        description="新しいペットの情報を登録します。"
        footer={
          <div className="flex gap-2 w-full">
            <button
              className="flex-1 py-2 rounded-lg border border-[#e0d6ce] text-sm text-gray-500"
              onClick={() => setIsPetModalOpen(false)}
            >
              キャンセル
            </button>
            <PrimaryButton
              className="flex-1 bg-[#D85A30] hover:bg-[#D85A30] hover:opacity-85"
              onClick={() => {
                console.log("ペット追加");
                setIsPetModalOpen(false);
              }}
            >
              登録する
            </PrimaryButton>
          </div>
        }
      />

      <Modal
        open={isInviteModalOpen}
        onOpenChange={(open) => setIsInviteModalOpen(open)}
        title="家族を招待する"
        description="招待URLを発行して家族と共有しましょう。"
        footer={
          <div className="flex gap-2 w-full">
            <button
              className="flex-1 py-2 rounded-lg border border-[#e0d6ce] text-sm text-gray-500"
              onClick={() => setIsInviteModalOpen(false)}
            >
              閉じる
            </button>
            <PrimaryButton
              className="flex-1 bg-[#D85A30] hover:bg-[#D85A30] hover:opacity-85"
              onClick={() => {
                console.log("招待URL発行");
                setIsInviteModalOpen(false);
              }}
            >
              URLを発行する
            </PrimaryButton>
          </div>
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

      <div className="fixed bottom-0 left-0 right-0">
        <BottomNavigation />
      </div>
    </div>
  );
}
