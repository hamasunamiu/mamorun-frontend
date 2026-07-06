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
import type { Pet, Member } from "@/types";
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
  const [loadError, setLoadError] = useState<string | null>(null);

  const [memberMap, setMemberMap] = useState<Map<string, string | null>>(
    new Map(),
  );

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

      // fetchLogs内、プロフィール取得結果の分岐を修正
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
      } else {
        // ★プロフィール取得自体が失敗した場合は致命的なエラーとして扱う
        setLoadError("情報の読み込みに失敗しました。もう一度お試しください。");
      }

      setIsLoading(false);
    };
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!pet?.id) return;

    const fetchMembers = async () => {
      try {
        const members = await apiFetch<Member[]>(`/api/pets/${pet.id}/members`);
        setMemberMap(new Map(members.map((m) => [m.id, m.display_name])));
      } catch (err) {
        console.error("家族メンバー取得失敗:", err);
      }
    };

    fetchMembers();
  }, [pet?.id]);

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
          console.log("★health_logs realtime event:", payload);
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

  const getAvatarInitial = (createdById: string | null) => {
    if (!createdById) return "?";
    const displayName = memberMap.get(createdById);
    if (displayName) {
      return displayName.slice(0, 1).toUpperCase();
    }
    return createdById.slice(0, 1).toUpperCase();
  };

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
      setLogs((prevLogs) =>
        prevLogs.filter((log) => log.id !== deleteTargetId)
      ); 
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

  const handleSwitchPet = async (selectedPet: Pet) => {
    setPet(selectedPet);
    setSelectedPetId(selectedPet.id);
    setIsPetSwitchModalOpen(false);

    try {
      const logsData = await apiFetch<HealthLog[]>(
        `/api/health-logs?petId=${selectedPet.id}`
      );
      setLogs(logsData ?? []);
    } catch (err) {
      console.error("ログ再取得失敗:", err);
    }
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#FAF8F6]">
      {/* ★home画面と統一：dateLabelを渡さないことでヘッダー高さを揃える */}
      <Header
        petName={pet?.name}
        petSpecies={pet?.species}
        onPetSwitch={() => {
          if (petList.length > 1) {
            setIsPetSwitchModalOpen(true);
          }
        }}
      />

      {/* ★投稿ボタン：ヘッダー直下・右寄せで固定表示 */}
      <div className="flex justify-end px-4 pt-2">
        <button
          data-testid="ui003-open-post-modal-button"
          onClick={() => setIsPostModalOpen(true)}
          className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg"
          aria-label="記録を追加"
        >
          <Plus size={22} strokeWidth={2} />
        </button>
      </div>

      {/* 過去の投稿一覧（スクロールエリア） */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {loadError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm"
            >
              再読み込み
            </button>
          </div>
        ) : isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            読み込み中...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            まだ記録がありません
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              // ★home画面のTodoCardと統一：枠線を削除し bg-white rounded-2xl のみに
              className="bg-white rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                {/* ★アバター：デザイントークン（accent）に統一 */}
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-accent-foreground">
                  {getAvatarInitial(log.created_by_id)}
                </div>
                <div>
                  {/* ★日時の文字色：ハードコードからトークンへ */}
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleDateString("ja-JP", {
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <p className="text-base font-semibold text-[#6E5849] mb-1">
                {log.title}
              </p>
              {log.attached_image_url && (
                <div className="w-full max-h-64 bg-muted rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                  <img
                    src={log.attached_image_url}
                    alt="添付画像"
                    className="max-w-full max-h-64 object-contain"
                  />
                </div>
              )}
              {log.detail_memo && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {log.detail_memo}
                </p>
              )}
              {currentUserId === log.created_by_id && (
                <div className="flex justify-end border-t border-border pt-2">
                  <button
                    className="flex items-center gap-1 text-xs text-gray-500"
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
          {/* ★見出しの色をトークン（foreground）に統一 */}
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
          {/* ★home画面のTodoFormModalと統一：色をPrimaryButtonのデフォルトに任せる */}
          <PrimaryButton
            data-testid="ui003-post-log-button"
            className="w-full h-12 rounded-2xl"
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
              className="h-11 flex-1 rounded-2xl border border-border text-sm font-medium text-foreground"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              キャンセル
            </button>
            <button
              className="h-11 flex-1 rounded-2xl bg-[#C1583D] text-sm font-medium text-white hover:bg-[#A84A32]"
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
