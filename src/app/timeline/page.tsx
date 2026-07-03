"use client";
import { useState, useEffect } from "react";
import { PenLine, Trash2, Plus } from "lucide-react";
import { Header } from "@/components/common/Header";
import { BottomNavigation } from "@/components/common/BottomNavigation";
import { InputField } from "@/components/common/InputField";
import { TextAreaField } from "@/components/common/TextAreaField";
import { ImageUploader } from "@/components/common/ImageUploader";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { Modal } from "@/components/common/Modal";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { Pet } from "@/types";
import { uploadPetImage } from "@/lib/petImageUpload";
import { PetSwitchModal } from "@/components/common/PetSwitchModal";
import { getSelectedPetId, setSelectedPetId } from "@/lib/petStorage";
import { supabase } from "@/lib/supabase";

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
  const [pet, setPet] = useState<Pet | null>(null);
  const [petList, setPetList] = useState<Pet[]>([]);
  const [isPetSwitchModalOpen, setIsPetSwitchModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      const savedPetId = getSelectedPetId();

      const [logsResult, profileResult] = await Promise.allSettled([
        apiFetch<HealthLog[]>("/api/health-logs"),
        apiFetch<{ id: string; pet_id: string | null }>("/api/profiles/me"),
      ]);

      if (logsResult.status === "fulfilled") {
        setLogs(logsResult.value ?? []);
      } else {
        setError("体調ログの取得に失敗しました。");
      }

      if (profileResult.status === "fulfilled") {
        setCurrentUserId(profileResult.value.id);

        const targetPetId = savedPetId ?? profileResult.value.pet_id;
        if (targetPetId) {
          try {
            const [petData, petListData] = await Promise.all([
              apiFetch<Pet>(`/api/pets/${targetPetId}`),
              apiFetch<Pet[]>("/api/pets"),
            ]);
            setPet(petData);
            setPetList(petListData ?? []);
          } catch (err) {
            console.error("ペット情報取得失敗:", err);
          }
        }
      }

      setIsLoading(false);
    };
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!pet?.id) return;

    const channel = supabase
      .channel(`health-logs-changes-${pet.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "health_logs",
          filter: `pet_id=eq.${pet.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newLog = payload.new as HealthLog;
            setLogs((prevLogs) => {
              if (prevLogs.some((l) => l.id === newLog.id)) {
                return prevLogs;
              }
              return [newLog, ...prevLogs];
            });
          } else if (payload.eventType === "DELETE") {
            const deletedLog = payload.old as HealthLog;
            setLogs((prevLogs) =>
              prevLogs.filter((l) => l.id !== deletedLog.id),
            );
          }
        },
      )
      .subscribe((status) => {
        console.log("[Realtime] health_logs Subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pet?.id]);

  const isSubmitDisabled = title.trim() === "" || isSubmitting;

  const handleSubmit = async () => {
    if (isSubmitDisabled) return;
    setIsSubmitting(true);
    try {
      let attachedImageUrl: string | undefined;

      if (imageFile && pet) {
        attachedImageUrl = await uploadPetImage(
          pet.id,
          imageFile,
          "health-log",
        );
      }

      const newLog = await apiFetch<HealthLog>("/api/health-logs", {
        method: "POST",
        body: JSON.stringify({
          title,
          detail_memo: memo,
          attached_image_url: attachedImageUrl,
        }),
      });

      setMemo("");
      setImageFile(null);
      setImageUploaderKey((prev) => prev + 1);
      setIsPostModalOpen(false);
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

  const handleSwitchPet = (selectedPet: Pet) => {
    setPet(selectedPet);
    setSelectedPetId(selectedPet.id);
    setIsPetSwitchModalOpen(false);
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#FFF9F5]">
      <Header
        petName={pet?.name}
        dateLabel={new Date().toLocaleDateString("ja-JP", {
          month: "long",
          day: "numeric",
          weekday: "short",
        })}
        onPetSwitch={() => {
          if (petList.length > 1) {
            setIsPetSwitchModalOpen(true);
          }
        }}
      />

      {/* 過去の投稿一覧（スクロールエリア） */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
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
                <div className="w-full max-h-64 bg-[#f5f0ea] rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                  <img
                    src={log.attached_image_url}
                    alt="添付画像"
                    className="max-w-full max-h-64 object-contain"
                  />
                </div>
              )}
              {log.detail_memo && (
                <p className="text-sm text-gray-500 leading-relaxed mb-3">
                  {log.detail_memo}
                </p>
              )}
              {currentUserId === log.created_by_id && (
                <div className="flex justify-end border-t border-[#f0e8e0] pt-2">
                  <button
                    className="flex items-center gap-1 text-xs text-gray-400"
                    onClick={() => handleDeleteClick(log.id)}
                  >
                    <Trash2 size={12} strokeWidth={1} />
                    削除
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 投稿用FABボタン（右下固定） */}
      <button
        data-testid="ui003-open-post-modal-button"
        onClick={() => setIsPostModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-[#D85A30] text-white flex items-center justify-center shadow-lg z-10"
        aria-label="記録を追加"
      >
        <Plus size={24} strokeWidth={2} />
      </button>

      <PetSwitchModal
        open={isPetSwitchModalOpen}
        onOpenChange={setIsPetSwitchModalOpen}
        petList={petList}
        currentPetId={pet?.id}
        onSwitch={handleSwitchPet}
      />

      {/* 投稿フォーム用モーダル */}
      <Modal
        open={isPostModalOpen}
        onOpenChange={setIsPostModalOpen}
        title="今日の記録を追加"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-[#993C1D]">
            <PenLine size={14} strokeWidth={1} />
            今日の記録
          </div>
          <InputField
            label="タイトル"
            name="title"
            data-testid="log-title-input"
            placeholder="例：朝の体調チェック"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextAreaField
            label="体調メモ"
            name="memo"
            data-testid="log-memo-input"
            placeholder="例：食欲あり、元気です"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
          <ImageUploader
            key={imageUploaderKey}
            label="写真"
            onFileSelect={(file) => setImageFile(file)}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <PrimaryButton
            data-testid="ui003-post-log-button"
            className="w-full bg-[#D85A30] text-white hover:bg-[#D85A30] hover:opacity-85"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            {isSubmitting ? "投稿中..." : "投稿する"}
          </PrimaryButton>
        </div>
      </Modal>

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

      <BottomNavigation />
    </div>
  );
}
