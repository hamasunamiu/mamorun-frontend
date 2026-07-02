import type { Profile, Pet } from "./types";

// ============================================================
// 動作確認用モックデータ
// ▼▼▼ バックエンド接続後、このファイルは必ず削除し、
//     呼び出し元のapiFetch呼び出しのみに戻すこと ▼▼▼
// ============================================================

export const MOCK_PROFILE: Profile = {
  id: "mock-profile-id",
  line_user_id: null,
  is_premium: false,
  stripe_customer_id: null,
  pet_id: "mock-pet-id",
  notification_time: "morning",
  display_name: "テストユーザー",
  created_at: "2026-06-01T00:00:00.000Z",
};

export const MOCK_PET: Pet = {
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

export const MOCK_PET_LIST: Pet[] = [
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