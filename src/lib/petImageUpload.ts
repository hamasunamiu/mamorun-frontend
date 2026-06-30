import { supabase } from "@/lib/supabase";

// ============================================================
// Supabase Storageへの画像アップロード共通処理
// 診察券・保険証は「1匹に1枚」のため、同じパスへupsert（上書き）する。
// バケット名: pet-images（Public bucket・5MB制限・jpg/png/webpのみ許可で作成済み）
// ============================================================

export async function uploadPetImage(
  petId: string,
  file: File,
  fileName: "hospital-card" | "insurance-card" | "health-log"
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const uniqueSuffix = fileName === "health-log" ? `-${Date.now()}` : "";
  const path = `${petId}/${fileName}${uniqueSuffix}.${fileExt}`;

  const { error } = await supabase.storage
    .from("pet-images")
    .upload(path, file, { upsert: true });

  if (error) {
    throw new Error(
      `画像のアップロードに失敗しました`);
  }

  const { data } = supabase.storage.from("pet-images").getPublicUrl(path);
  return data.publicUrl;
}