"use client";
import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/common/Header";
import { BottomNavigation } from "@/components/common/BottomNavigation";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { Modal } from "@/components/common/Modal";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { Pet, Profile } from "@/types";
import { Stethoscope, Crown, SendHorizontal } from "lucide-react";
import { getSelectedPetId } from "@/lib/petStorage";

type Message = {
  role: "ai" | "user";
  content: string;
};

type AiChatResponse = {
  reply: string;
  remaining_count: number | null;
};

type AiUsageResponse = {
  used_count: number;
  remaining_count: number | null;
  is_premium: boolean;
};

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [remainingCount, setRemainingCount] = useState<number | null>(3);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pet, setPet] = useState<Pet | null>(null);

  // ★自動スクロール用：メッセージ一覧の一番下に置く「目印」要素への参照
  const bottomRef = useRef<HTMLDivElement>(null);

  // ------------------------------------------------------------
  // 初期表示：当日のAI利用回数・プレミアム状態・ペット情報を取得
  // ------------------------------------------------------------
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const usage = await apiFetch<AiUsageResponse>("/api/ai/usage");
        setIsPremium(usage.is_premium);
        setRemainingCount(usage.remaining_count);

        const profile = await apiFetch<Profile>("/api/profiles/me");

        if (profile.pet_id) {
          const savedPetId = getSelectedPetId();
          const targetPetId = savedPetId ?? profile.pet_id;

          const petData = await apiFetch<Pet>(`/api/pets/${targetPetId}`);
          setPet(petData);

          const honorific = petData.gender === "female" ? "ちゃん" : "くん";
          setMessages([
            {
              role: "ai",
              content: `こんにちは！${petData.name}${honorific}のことで気になることがあれば何でも聞いてください🐾`,
            },
          ]);
        } else {
          setMessages([
            {
              role: "ai",
              content: "こんにちは！気になることがあれば何でも聞いてください🐾",
            },
          ]);
        }
      } catch (err) {
        console.error("初期データ取得失敗:", err);
        setMessages([
          {
            role: "ai",
            content: "こんにちは！気になることがあれば何でも聞いてください🐾",
          },
        ]);
      }
    };

    fetchInitialData();
  }, []);

  // ★メッセージが増えるたびに一番下までスクロールする
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const isSubmitDisabled =
    input.trim() === "" || input.length > 500 || isSending;

  const handleSubmit = async () => {
    if (isSubmitDisabled) return;

    // 無料会員で上限に達した場合
    if (!isPremium && remainingCount !== null && remainingCount <= 0) {
      setIsPremiumModalOpen(true);
      return;
    }

    const messageText = input;

    // ユーザーメッセージを追加
    const userMessage: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSendError(null);
    setIsSending(true);

    try {
      const response = await apiFetch<AiChatResponse>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: messageText }),
      });

      const aiMessage: Message = { role: "ai", content: response.reply };
      setMessages((prev) => [...prev, aiMessage]);
      setRemainingCount(response.remaining_count);
    } catch (err) {
      if (err instanceof ApiError && err.code === "AI_LIMIT_EXCEEDED") {
        setRemainingCount(0);
        setIsPremiumModalOpen(true);
        setMessages((prev) => prev.slice(0, -1));
      } else {
        setSendError(
          err instanceof ApiError
            ? err.message
            : "通信エラーが発生しました。時間をおいて再度お試しください。",
        );
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#FAF8F6]">
      <Header title="獣医師AI相談" />

      {/* 残り回数バッジ */}
      <div className="px-4 pt-3">
        {isPremium ? (
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1 bg-[#FAECE7] border border-[#D85A30] text-[#993C1D] text-xs font-medium px-3 py-1 rounded-full">
              <Crown size={14} color="#993C1D" strokeWidth={1} />
              プレミアム会員（無制限）
            </span>
          </div>
        ) : (
          <div className="flex justify-end">
            <span
              data-testid="ui004-remaining-count"
              className="bg-[#f0ece8] border border-[#e0d6ce] text-[#888780] text-xs font-medium px-3 py-1 rounded-full"
            >
              本日の残り相談回数：{remainingCount ?? 0} / 3回
            </span>
          </div>
        )}
      </div>

      {/* メッセージ一覧（スクロール領域） */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "items-start gap-2"}`}
          >
            {message.role === "ai" && (
              <div className="w-7 h-7 rounded-full bg-[#FAECE7] border border-[#e0c4b0] flex items-center justify-center flex-shrink-0">
                <Stethoscope size={14} className="text-[#993C1D]" />
              </div>
            )}
            <div
              className={`rounded-2xl px-3 py-2.5 text-sm leading-relaxed max-w-[75%] ${
                message.role === "user"
                  ? "bg-[#D85A30] rounded-br-none text-white"
                  : "bg-white border border-[#e0d6ce] rounded-tl-none text-gray-800"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-[#FAECE7] border border-[#e0c4b0] flex items-center justify-center flex-shrink-0">
              <Stethoscope size={14} className="text-[#993C1D]" />
            </div>
            <div className="rounded-2xl px-3 py-2.5 text-sm bg-white border border-[#e0d6ce] rounded-tl-none text-gray-400">
              入力中...
            </div>
          </div>
        )}
        {sendError && (
          <p className="text-xs text-red-500 text-center mt-2">{sendError}</p>
        )}
        {/* ★スクロール先の目印。中身は空でOK */}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア（BottomNavigationの高さ分の余白を確保） */}
      <div className="flex-shrink-0 bg-white border-t border-[#e0d6ce] px-4 py-3 pb-[calc(0.75rem+64px)]">
        <div className="flex items-end gap-2">
          <textarea
            data-testid="ui004-chat-input"
            placeholder="気になることを入力..."
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending}
            className="flex-1 border border-[#e0d6ce] rounded-xl px-3 py-2.5 text-sm bg-[#FFF9F5] outline-none resize-none leading-relaxed disabled:opacity-60"
          />
          <PrimaryButton
            data-testid="ui004-send-button"
            className="w-10 h-10 rounded-full bg-[#D85A30] text-white hover:bg-[#D85A30] hover:opacity-85 flex-shrink-0 disabled:opacity-40"
            aria-label="送信"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            <SendHorizontal size={18} color="#ffffff" strokeWidth={1} />
          </PrimaryButton>
        </div>
        <p className="text-xs text-gray-400 text-right mt-1">
          {input.length} / 500
        </p>
      </div>

      {/* プレミアム誘導モーダル */}
      <Modal
        open={isPremiumModalOpen}
        onOpenChange={(open) => setIsPremiumModalOpen(open)}
        title="本日の無料相談回数に達しました"
        description="プレミアムプランにアップグレードすると、AI相談が無制限になります。"
        footer={
          <div className="flex gap-2 w-full">
            <button
              className="flex-1 py-2 rounded-lg border border-[#e0d6ce] text-sm text-gray-500"
              onClick={() => setIsPremiumModalOpen(false)}
            >
              閉じる
            </button>
            <PrimaryButton
              className="flex-1 bg-[#D85A30] hover:bg-[#D85A30] hover:opacity-85"
              onClick={() => {
                setIsPremiumModalOpen(false);
              }}
            >
              <span className="flex items-center justify-center gap-1">
                <Crown size={14} color="#ffffff" strokeWidth={1} />
                アップグレード
              </span>
            </PrimaryButton>
          </div>
        }
      />

      <div className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[430px]">
        <BottomNavigation />
      </div>
    </div>
  );
}