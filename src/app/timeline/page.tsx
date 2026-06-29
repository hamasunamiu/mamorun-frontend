"use client";
import { useState, useEffect } from "react";
import { Header } from "@/components/common/Header";
import { BottomNavigation } from "@/components/common/BottomNavigation";
import { InputField } from "@/components/common/InputField";
import { TextAreaField } from "@/components/common/TextAreaField";
import { ImageUploader } from "@/components/common/ImageUploader";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { Modal } from "@/components/common/Modal";
import { apiFetch, ApiError } from "@/lib/api-client";

type HealthLog = {
  id: string;
  pet_id: string;
  created_by_id: string | null;
  title: string;
  detail_memo: string | null;
  attached_image_url: string | null;
  created_at: string;
};

export default function TimelinePage() {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUploaderKey, setImageUploaderKey] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await apiFetch<{ data: HealthLog[]; total: number }>(
          "/api/health-logs",
        );
        setLogs(data.data ?? []);
        const profile = await apiFetch<{ data: { id: string } }>(
          "/api/profiles/me",
        );
        setCurrentUserId(profile.data.id);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("体調ログの取得に失敗しました。");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const isSubmitDisabled = title.trim() === "" || isSubmitting;

  const handleSubmit = async () => {
    if (isSubmitDisabled) return;
    setIsSubmitting(true);
    try {
      const newLog = await apiFetch<HealthLog>("/api/health-logs", {
        method: "POST",
        body: JSON.stringify({
          title,
          detail_memo: memo,
        }),
      });
      setLogs((prev) => [newLog, ...prev]);
      setTitle("");
      setMemo("");
      setImageFile(null);
      setImageUploaderKey((prev) => prev + 1);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("投稿に失敗しました。");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await apiFetch(`/api/health-logs/${deleteTargetId}`, {
        method: "DELETE",
      });
      setLogs((prev) => prev.filter((log) => log.id !== deleteTargetId));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("削除に失敗しました。");
      }
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] pb-20">
      <Header petName="むぎ" dateLabel="6月23日（月）" />

      <div className="p-4 flex flex-col gap-3">
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
              key={imageUploaderKey}
              label="写真"
              onFileSelect={(file) => setImageFile(file)}
            />
          </div>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          <PrimaryButton
            className="w-full mt-3 bg-[#D85A30] text-white hover:bg-[#D85A30] hover:opacity-85"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            {isSubmitting ? "投稿中..." : "投稿する"}
          </PrimaryButton>
        </div>

        {isLoading ? (
          <div className="text-center text-sm text-gray-400 py-8">
            読み込み中...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-8">
            まだ記録がありません
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="bg-white rounded-2xl border border-[#e0d6ce] p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#FAECE7] flex items-center justify-center text-xs font-medium text-[#993C1D]">
                  {log.created_by_id?.slice(0, 1).toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="text-xs text-gray-400">
                    {new Date(log.created_at).toLocaleDateString("ja-JP", {
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-800 mb-1">
                {log.title}
              </p>
              {log.attached_image_url && (
                <img
                  src={log.attached_image_url}
                  alt="添付画像"
                  className="w-full h-32 rounded-lg object-cover mb-2"
                />
              )}
              {log.detail_memo && (
                <p className="text-sm text-gray-500 leading-relaxed mb-3">
                  {log.detail_memo}
                </p>
              )}
              {currentUserId === log.created_by_id && (
                <div className="flex justify-end border-t border-[#f0e8e0] pt-2">
                  <button
                    className="text-xs text-gray-400"
                    onClick={() => handleDeleteClick(log.id)}
                  >
                    🗑 削除
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

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
