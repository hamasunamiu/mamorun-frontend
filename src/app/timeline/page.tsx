"use client";
import { useState } from "react";
import { Header } from "@/components/common/Header";
import { BottomNavigation } from "@/components/common/BottomNavigation";
import { InputField } from "@/components/common/InputField"; //プルリクレビューによりInputFieldsがInputFieldに。
import { TextAreaField } from "@/components/common/TextAreaField";
import { ImageUploader } from "@/components/common/ImageUploader";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { Modal } from "@/components/common/Modal";

export default function TimelinePage() {
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // 投稿ボタンの活性/非活性（タイトルが空なら送れない）
  const isSubmitDisabled = title.trim() === "";

  // 投稿処理（後でAPI繋ぎ込む場所）
  const handleSubmit = async () => {
    // TODO: POST /api/health-logs
    console.log({ title, memo, imageFile });
    // 投稿後にフォームリセット
    setTitle("");
    setMemo("");
    setImageFile(null);
  };

  // 削除処理（後でAPI繋ぎ込む場所）
  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    // TODO: DELETE /api/health-logs/:logId
    console.log("delete:", deleteTargetId);
    setIsDeleteModalOpen(false);
    setDeleteTargetId(null);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] pb-20">
      <Header petName="むぎ" dateLabel="6月23日（月）" />

      <div className="p-4 flex flex-col gap-3">
        {/* 投稿フォーム */}
        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <p className="text-sm font-medium text-[#993C1D] mb-3">
            ✏️ 今日の記録を追加
          </p>
          <div className="flex flex-col gap-3">
            <InputField
              label="タイトル"
              name="title"
              placeholder="例：朝の体調チェック"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextAreaField
              label="体調メモ"
              name="memo"
              placeholder="例：食欲あり、元気です"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
            <ImageUploader
              label="写真"
              onFileSelect={(file) => setImageFile(file)}
            />
          </div>
          <PrimaryButton
            className="w-full mt-3 bg-[#D85A30] text-white hover:bg-[#D85A30] hover:opacity-85"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            投稿する
          </PrimaryButton>
        </div>

        {/* タイムラインログ1 */}
        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-[#FAECE7] flex items-center justify-center text-xs font-medium text-[#993C1D]">
              ま
            </div>
            <div>
              <p className="text-xs font-medium text-[#993C1D]">まの</p>
              <p className="text-xs text-gray-400">6月12日 08:32</p>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-800 mb-1">
            朝の散歩、元気いっぱい！
            {/* タイムラインログ1の画像部分を差し替え */}
            <img
              src="/images/timeline-shiba.png"
              alt="散歩の様子"
              className="w-full h-32 rounded-lg object-cover mb-2"
            />
            今日はいつもより長めに歩いた。食欲も普通。うんちは1回、問題なし。
          </p>
          <div className="flex justify-end border-t border-[#f0e8e0] pt-2">
            <button
              className="text-xs text-gray-400"
              onClick={() => handleDeleteClick("dummy-id-1")}
            >
              🗑 削除
            </button>
          </div>
        </div>

        {/* タイムラインログ2 */}
        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-[#FAECE7] flex items-center justify-center text-xs font-medium text-[#993C1D]">
              ゆ
            </div>
            <div>
              <p className="text-xs font-medium text-[#993C1D]">ゆい</p>
              <p className="text-xs text-gray-400">6月11日 21:15</p>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-800 mb-1">
            夜ごはん完食🍚
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            いつも通り完食。元気そう。薬も問題なく飲めた。
          </p>
        </div>
      </div>

      {/* 削除確認モーダル */}
      <Modal
        open={isDeleteModalOpen}
        onOpenChange={(open) => setIsDeleteModalOpen(open)}
        title="ログを削除しますか？"
        description="この操作は取り消せません。"
        footer={
          <div className="flex gap-2 w-full">
            <button
              className="flex-1 py-2 rounded-lg border border-[#e0d6ce] text-sm text-gray-500"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              キャンセル
            </button>
            <button
              className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm"
              onClick={handleDeleteConfirm}
            >
              削除する
            </button>
          </div>
        }
      />

      <div className="fixed bottom-0 left-0 right-0">
        <BottomNavigation />
      </div>
    </div>
  );
}
