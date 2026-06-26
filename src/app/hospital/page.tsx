"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputField } from "@/components/common/InputField";
import { ImageUploader } from "@/components/common/ImageUploader";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmergencyCallButton } from "@/components/common/EmergencyCallButton";
import { Header } from "@/components/common/Header";
import { BottomNavigation } from "@/components/common/BottomNavigation";
import { Modal } from "@/components/common/Modal";
import { Card } from "@/components/common/Card";
import { apiFetch, ApiError } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

// ============================================================
// 型定義（home/page.tsx の Profile / Pet 型に準拠。
// 本来は共通の types/ フォルダへ切り出すのが理想だが、
// 現状 home/page.tsx 内にも同じ型が個別定義されているため、
// 既存の規約に合わせてこのファイル内に定義する）
// ============================================================

type Profile = {
  id: string;
  line_user_id: string | null;
  is_premium: boolean;
  stripe_customer_id: string | null;
  pet_id: string | null;
  notification_time: "morning" | "night";
  created_at: string;
};

type Pet = {
  id: string;
  name: string;
  species: "dog" | "cat";
  gender: "male" | "female" | null;
  birthday: string | null;
  illness: string | null;
  hospital_name: string | null;
  hospital_phone: string | null;
  hospital_address: string | null;
  hospital_card_image_url: string | null;
  insurance_card_image_url: string | null;
  created_at: string;
};

// ============================================================
// フォーム用Zodスキーマ
// ⚠️ 電話番号は緊急発信に直結するため、半角数字のみを厳格にチェックする
// （セキュリティ設計書 §4②・画面設計書 UI-007バリデーション準拠）
// ============================================================

const hospitalSchema = z.object({
  hospital_name: z
    .string()
    .min(1, "病院名を入力してください")
    .max(250, "250文字以内で入力してください"),
  hospital_phone: z
    .string()
    .min(1, "電話番号を入力してください")
    .max(50, "50文字以内で入力してください")
    .regex(/^[0-9]+$/, "半角数字のみ使用できます"),
  hospital_address: z
    .string()
    .min(1, "住所を入力してください")
    .max(100, "100文字以内で入力してください"),
});

type HospitalFormValues = z.infer<typeof hospitalSchema>;

// ============================================================
// 動作確認用モックデータ
// ▼▼▼ バックエンド接続後、このブロックと下記useEffect内の切り替えは必ず削除し、
//     元のapiFetch呼び出しのみに戻すこと ▼▼▼
// ============================================================

const MOCK_PROFILE: Profile = {
  id: "mock-profile-id",
  line_user_id: null,
  is_premium: false,
  stripe_customer_id: null,
  pet_id: "mock-pet-id",
  notification_time: "morning",
  created_at: "2026-06-01T00:00:00.000Z",
};

const MOCK_PET: Pet = {
  id: "mock-pet-id",
  name: "むぎ",
  species: "dog",
  gender: "female",
  birthday: "2023-04-01",
  illness: "アレルギー性皮膚炎",
  hospital_name: "ミズ動物病院",
  hospital_phone: "0312345678",
  hospital_address: "東京都渋谷区〇〇1-2-3",
  hospital_card_image_url: null,
  insurance_card_image_url: null,
  created_at: "2026-06-01T00:00:00.000Z",
};

// ▲▲▲ 動作確認用モックデータここまで ▲▲▲

const MOCK_PET_LIST: Pet[] = [
  MOCK_PET,
  {
    id: "mock-pet-id-2",
    name: "もも",
    species: "cat",
    gender: "female",
    birthday: "2022-09-10",
    illness: null,
    hospital_name: "ミスペットクリニック",
    hospital_phone: "0398765432",
    hospital_address: "東京都新宿区〇〇1-2-3",
    hospital_card_image_url: null,
    insurance_card_image_url: null,
    created_at: "2026-06-01T00:00:00.000Z",
  },
];

// ▼ 動作確認用フラグ：バックエンド接続後は false に変更、または関連コードを削除すること
const USE_MOCK_DATA = true;

// ============================================================
// Supabase Storageへの画像アップロード共通処理
// 診察券・保険証は「1匹に1枚」のため、同じパスへupsert（上書き）する。
// バケット名: pet-images（Public bucket・5MB制限・jpg/png/webpのみ許可で作成済み）
// ============================================================

async function uploadPetImage(
  petId: string,
  file: File,
  fileName: "hospital-card" | "insurance-card"
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const path = `${petId}/${fileName}.${fileExt}`;

  const { error } = await supabase.storage
    .from("pet-images")
    .upload(path, file, { upsert: true });

  if (error) {
    throw new Error(
      `画像のアップロードに失敗しました（${fileName === "hospital-card" ? "診察券" : "保険証"}）`
    );
  }

  const { data } = supabase.storage.from("pet-images").getPublicUrl(path);
  return data.publicUrl;
}

export default function HospitalPage() {
  const router = useRouter();

  const [pet, setPet] = useState<Pet | null>(null);
  const [petList, setPetList] = useState<Pet[]>([]);
  const [isPetSwitchModalOpen, setIsPetSwitchModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 閲覧モード／編集モードの切り替え。
  // 保存後は誤操作防止のため自動的に閲覧モードへ戻す。
  const [isEditing, setIsEditing] = useState(false);

  // 診察券・保険証の画像（ImageUploaderから受け取ったバリデーション済みFile）
  // 未選択の場合はnull（＝既存画像を変更しない、または画像なしのまま）
  const [hospitalCardFile, setHospitalCardFile] = useState<File | null>(null);
  const [insuranceCardFile, setInsuranceCardFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HospitalFormValues>({
    resolver: zodResolver(hospitalSchema),
    defaultValues: {
      hospital_name: "",
      hospital_phone: "",
      hospital_address: "",
    },
  });

  // ------------------------------------------------------------
  // データ取得：① profiles/me → pet_id → ② pets/:petId
  // 取得できたらフォームへ reset() で値を流し込む
  // ------------------------------------------------------------
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setLoadError(null);

      // ▼▼▼ 動作確認用：バックエンド未接続のため一時的にモックデータを使用 ▼▼▼
      // バックエンド接続後、この if ブロックを削除し、下のtry/catchのみに戻すこと
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setPet(MOCK_PET);
        setPetList(MOCK_PET_LIST);
        reset({
          hospital_name: MOCK_PET.hospital_name ?? "",
          hospital_phone: MOCK_PET.hospital_phone ?? "",
          hospital_address: MOCK_PET.hospital_address ?? "",
        });
        setIsLoading(false);
        return;
      }
      // ▲▲▲ 動作確認用ここまで ▲▲▲

      try {
        const profileData = await apiFetch<Profile>("/api/profiles/me");

        if (!profileData.pet_id) {
          router.push("/login");
          return;
        }

        const petData = await apiFetch<Pet>(`/api/pets/${profileData.pet_id}`);
        setPet(petData);
        reset({
          hospital_name: petData.hospital_name ?? "",
          hospital_phone: petData.hospital_phone ?? "",
          hospital_address: petData.hospital_address ?? "",
        });
      } catch (err) {
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "データの取得に失敗しました。時間をおいて再度お試しください。"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [router, reset]);

  // ペットを切り替えたら、選んだペットの病院情報をフォームへ反映し直す。
  // home画面のペット切り替えと違い、病院情報画面では「表示中のフォーム値」も
  // 切り替え先のペットのものに更新する必要がある点に注意。
  const handleSwitchPet = (selectedPet: Pet) => {
    setPet(selectedPet);
    reset({
      hospital_name: selectedPet.hospital_name ?? "",
      hospital_phone: selectedPet.hospital_phone ?? "",
      hospital_address: selectedPet.hospital_address ?? "",
    });
    // 切り替え前のペットで選択していた画像ファイルが残らないようにリセットする
    setHospitalCardFile(null);
    setInsuranceCardFile(null);
    // ペットを切り替えたら編集モードは強制終了し、誤って別ペットの情報を編集しないようにする
    setIsEditing(false);
    setIsPetSwitchModalOpen(false);
  };

  const onSubmit = async (values: HospitalFormValues) => {
    if (!pet) return;

    setIsSubmitting(true);
    setSaveError(null);

    // ▼▼▼ 動作確認用：バックエンド未接続のため一時的にモック保存とする ▼▼▼
    // バックエンド接続後、この if ブロックを削除し、下のtry/catchのみに戻すこと
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setPet({
        ...pet,
        hospital_name: values.hospital_name,
        hospital_phone: values.hospital_phone,
        hospital_address: values.hospital_address,
        // モードでは実アップロードは行わず、選択していれば仮のローカルURLのみ反映する
        hospital_card_image_url: hospitalCardFile
          ? URL.createObjectURL(hospitalCardFile)
          : pet.hospital_card_image_url,
        insurance_card_image_url: insuranceCardFile
          ? URL.createObjectURL(insuranceCardFile)
          : pet.insurance_card_image_url,
      });
      setHospitalCardFile(null);
      setInsuranceCardFile(null);
      setIsEditing(false);
      setIsSubmitting(false);
      return;
    }
    // ▲▲▲ 動作確認用ここまで ▲▲▲

    try {
      // ① 画像が新たに選択されていればアップロードし、URLを取得する。
      //    選択されていなければ既存のURL（変更なし）をそのまま使う。
      let hospitalCardUrl = pet.hospital_card_image_url;
      let insuranceCardUrl = pet.insurance_card_image_url;

      if (hospitalCardFile) {
        hospitalCardUrl = await uploadPetImage(
          pet.id,
          hospitalCardFile,
          "hospital-card"
        );
      }
      if (insuranceCardFile) {
        insuranceCardUrl = await uploadPetImage(
          pet.id,
          insuranceCardFile,
          "insurance-card"
        );
      }

      // ② テキスト項目＋画像URLをまとめてPATCH
      const updatedPet = await apiFetch<Pet>(`/api/pets/${pet.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          hospital_name: values.hospital_name,
          hospital_phone: values.hospital_phone,
          hospital_address: values.hospital_address,
          hospital_card_image_url: hospitalCardUrl,
          insurance_card_image_url: insuranceCardUrl,
        }),
      });

      setPet(updatedPet);
      setHospitalCardFile(null);
      setInsuranceCardFile(null);
      setIsEditing(false);
    } catch (err) {
      setSaveError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "保存に失敗しました。時間をおいて再度お試しください。"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------------------
  // 早期return（ローディング・エラー）
  // ------------------------------------------------------------

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center bg-[#FFF9F5]">
        <LoadingSpinner size="lg" />
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center bg-[#FFF9F5] px-6">
        <ErrorMessage message={loadError} />
      </main>
    );
  }

  // ------------------------------------------------------------
  // 本体UI
  // ------------------------------------------------------------

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#FFF9F5] pb-20">
      {/* ★画面最上部の緊急発信ボタン（FR-004準拠・UI-002と同じrightSlotパターンで設置）
          病院電話番号が未登録の場合はボタン自体を出さない */}
      <Header
        petName={pet?.name}
        petSpecies={pet?.species}
        suffix="の病院情報"
        onPetSwitch={() => {
          if (petList.length > 1) {
            setIsPetSwitchModalOpen(true);
          }
        }}
        rightSlot={
          pet?.hospital_phone ? (
            <EmergencyCallButton phoneNumber={pet.hospital_phone} />
          ) : undefined
        }
      />

      {isEditing ? (
        // ------------------------------------------------------------
        // 編集モード：フォーム（InputField + ImageUploader）
        // ------------------------------------------------------------
        <div className="p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4 flex flex-col gap-3">
              <InputField
                label="病院名"
                required
                placeholder="例：〇〇動物病院"
                {...register("hospital_name")}
                error={errors.hospital_name?.message}
              />

              <InputField
                label="電話番号"
                required
                type="tel"
                inputMode="numeric"
                placeholder="0312345678"
                {...register("hospital_phone")}
                error={errors.hospital_phone?.message}
              />

              <InputField
                label="住所"
                required
                placeholder="例：東京都渋谷区..."
                {...register("hospital_address")}
                error={errors.hospital_address?.message}
              />
            </div>

            {/* 診察券・保険証の画像（任意・jpg/png/webp・5MB以内）
                ImageUploader自体がMIMEタイプ・サイズの事前チェックとプレビュー表示を内包している */}
            <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4 flex flex-col gap-4">
              <ImageUploader
                label="診察券"
                onFileSelect={setHospitalCardFile}
                initialImageUrl={pet?.hospital_card_image_url ?? undefined}
              />
              <ImageUploader
                label="保険証"
                onFileSelect={setInsuranceCardFile}
                initialImageUrl={pet?.insurance_card_image_url ?? undefined}
              />
            </div>

            {saveError && <ErrorMessage message={saveError} />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  // 編集を取り消し、フォームの値を現在のpetの内容に戻してから閲覧モードへ
                  if (pet) {
                    reset({
                      hospital_name: pet.hospital_name ?? "",
                      hospital_phone: pet.hospital_phone ?? "",
                      hospital_address: pet.hospital_address ?? "",
                    });
                  }
                  setHospitalCardFile(null);
                  setInsuranceCardFile(null);
                  setSaveError(null);
                  setIsEditing(false);
                }}
                className="h-12 flex-1 rounded-2xl border border-border text-sm font-medium text-foreground"
              >
                キャンセル
              </button>
              <PrimaryButton
                type="submit"
                disabled={isSubmitting}
                className="h-12 flex-1 bg-[#D85A30] text-white hover:bg-[#D85A30] hover:opacity-85"
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : "保存する"}
              </PrimaryButton>
            </div>
          </form>
        </div>
      ) : (
        // ------------------------------------------------------------
        // 閲覧モード：テキスト表示＋画像表示のみ（編集ボタンを押すまで編集不可）
        // ------------------------------------------------------------
        <div className="p-4 flex flex-col gap-4">
          <Card>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-muted-foreground">病院名</p>
                <p className="text-sm text-foreground">
                  {pet?.hospital_name || "未登録"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">電話番号</p>
                <p className="text-sm text-foreground">
                  {pet?.hospital_phone || "未登録"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">住所</p>
                <p className="text-sm text-foreground">
                  {pet?.hospital_address || "未登録"}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">診察券</p>
                {pet?.hospital_card_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pet.hospital_card_image_url}
                    alt="診察券のプレビュー"
                    className="h-72 w-full rounded-md border border-border object-cover"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">未登録</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">保険証</p>
                {pet?.insurance_card_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pet.insurance_card_image_url}
                    alt="保険証のプレビュー"
                    className="h-72 w-full rounded-md border border-border object-cover"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">未登録</p>
                )}
              </div>
            </div>
          </Card>

          <PrimaryButton
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-full bg-[#D85A30] text-white hover:bg-[#D85A30] hover:opacity-85"
          >
            編集する
          </PrimaryButton>
        </div>
      )}

      {/* ペット切り替え用のModal（2匹以上の場合に表示）
          切り替え時、選んだペットの病院情報をフォームへ反映する */}
      <Modal
        open={isPetSwitchModalOpen}
        onOpenChange={setIsPetSwitchModalOpen}
        title="ペットを切り替える"
      >
        <div className="flex flex-col gap-2">
          {petList.map((p) => {
            const isSelected = p.id === pet?.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSwitchPet(p)}
                aria-pressed={isSelected}
                className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium ${
                  isSelected
                    ? "border-[#C4956A] bg-[#FBE9DD] text-[#993C1D]"
                    : "border-border bg-background text-foreground"
                }`}
              >
                <span aria-hidden="true">
                  {p.species === "dog" ? "🐶" : "🐱"}
                </span>
                {p.name}
              </button>
            );
          })}
        </div>
      </Modal>

      <div className="fixed bottom-0 left-0 right-0">
        <BottomNavigation />
      </div>
    </div>
  );
}