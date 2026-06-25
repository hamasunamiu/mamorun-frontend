"use client";
import { useState } from "react";
import { Header } from "@/components/common/Header";
import { BottomNavigation } from "@/components/common/BottomNavigation";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { Modal } from "@/components/common/Modal";

type Message = {
  role: "ai" | "user";
  content: string;
};

const INITIAL_MESSAGES: Message[] = [
  {
    role: "ai",
    content:
      "こんにちは！むぎちゃんのことで気になることがあれば何でも聞いてください🐾",
  },
];

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [remainingCount, setRemainingCount] = useState(3); // ダミー：残り3回
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  const isSubmitDisabled = input.trim() === "" || input.length > 500;

  const handleSubmit = async () => {
    if (isSubmitDisabled) return;

    // 無料会員で上限に達した場合
    if (!isPremium && remainingCount <= 0) {
      setIsPremiumModalOpen(true);
      return;
    }

    // ユーザーメッセージを追加
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // TODO: POST /api/ai/chat
    console.log("AI相談送信:", input);

    // ダミーのAI返答
    const aiMessage: Message = {
      role: "ai",
      content: "（AIの返答がここに表示されます）",
    };
    setMessages((prev) => [...prev, aiMessage]);

    // 残り回数を減らす（ダミー）
    if (!isPremium) {
      setRemainingCount((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] flex flex-col pb-16">
      <Header title="獣医師AI相談" />

      {/* 残り回数バッジ */}
      <div className="px-4 pt-3">
        {isPremium ? (
          <div className="flex justify-end">
            <span className="bg-[#FAECE7] border border-[#D85A30] text-[#993C1D] text-xs font-medium px-3 py-1 rounded-full">
              👑 プレミアム会員（無制限）
            </span>
          </div>
        ) : (
          <div className="flex justify-end">
            <span className="bg-[#f0ece8] border border-[#e0d6ce] text-[#888780] text-xs font-medium px-3 py-1 rounded-full">
              本日の残り相談回数：{remainingCount} / 3回
            </span>
          </div>
        )}
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 p-4 flex flex-col gap-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "items-start gap-2"}`}
          >
            {message.role === "ai" && (
              <div className="w-7 h-7 rounded-full bg-[#FAECE7] border border-[#e0c4b0] flex items-center justify-center text-sm flex-shrink-0">
                🩺
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
      </div>

      {/* 入力エリア */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-[#e0d6ce] px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            placeholder="気になることを入力..."
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border border-[#e0d6ce] rounded-xl px-3 py-2.5 text-sm bg-[#FFF9F5] outline-none resize-none leading-relaxed"
          />
          <PrimaryButton
            className="w-10 h-10 rounded-full bg-[#D85A30] text-white hover:bg-[#D85A30] hover:opacity-85 flex-shrink-0 disabled:opacity-40"
            aria-label="送信"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            ➤
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
                // TODO: 設定画面へ遷移
                setIsPremiumModalOpen(false);
              }}
            >
              👑 アップグレード
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
