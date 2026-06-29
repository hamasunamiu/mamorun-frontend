"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmergencyCallButton } from "@/components/common/EmergencyCallButton";
import { Header } from "@/components/common/Header";
import { BottomNavigation } from "@/components/common/BottomNavigation";
import { PetSwitchModal } from "@/components/common/PetSwitchModal";
import { apiFetch, ApiError } from "@/lib/api-client";
import { uploadPetImage } from "@/lib/petImageUpload";
import type { Profile, Pet } from "./_components/types";
import { MOCK_PET, MOCK_PET_LIST } from "./_components/mockData";
import { HospitalDisplayView } from "./_components/HospitalDisplayView";
import { HospitalEditView } from "./_components/HospitalEditView";

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

// ▼ 動作確認用フラグ：バックエンド接続後は false に変更、または関連コードを削除すること
const USE_MOCK_DATA = true;

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
            : "データの取得に失敗しました。時間をおいて再度お試しください。",
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

  const handleCancelEdit = () => {
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
          "hospital-card",
        );
      }
      if (insuranceCardFile) {
        insuranceCardUrl = await uploadPetImage(
          pet.id,
          insuranceCardFile,
          "insurance-card",
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
          : "保存に失敗しました。時間をおいて再度お試しください。",
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
        <HospitalEditView
          pet={pet}
          onSubmit={handleSubmit(onSubmit)}
          register={register}
          errors={errors}
          onHospitalCardSelect={setHospitalCardFile}
          onInsuranceCardSelect={setInsuranceCardFile}
          saveError={saveError}
          isSubmitting={isSubmitting}
          onCancel={handleCancelEdit}
        />
      ) : (
        <HospitalDisplayView pet={pet} onEditClick={() => setIsEditing(true)} />
      )}

      {/* ペット切り替え用のModal（2匹以上の場合に表示）
          切り替え時、選んだペットの病院情報をフォームへ反映する */}
      <PetSwitchModal
        open={isPetSwitchModalOpen}
        onOpenChange={setIsPetSwitchModalOpen}
        petList={petList}
        currentPetId={pet?.id}
        onSwitch={handleSwitchPet}
      />

      <div className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-md">
        <BottomNavigation />
      </div>
    </div>
  );
}
