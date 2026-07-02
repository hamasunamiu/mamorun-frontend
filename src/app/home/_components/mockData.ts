// src/app/home/_components/mockData.ts

import type { Profile, Pet, Todo, Schedule } from "./types";

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
    hospital_phone: "0312345678",
    hospital_address: "東京都新宿区〇〇1-2-3",
    hospital_card_image_url: null,
    insurance_card_image_url: null,
    created_at: "2026-06-01T00:00:00.000Z",
  },
];

export const MOCK_TODOS: Todo[] = [
  {
    id: "todo-1",
    pet_id: "mock-pet-id",
    task_name: "朝ごはん　7時",
    is_completed: true,
    completed_by_id: "mock-profile-id",
    completed_by: { display_name: "テストユーザー" },
    completed_at: "2026-06-24T07:00:00.000Z",
    todo_date: "2026-06-24",
    created_at: "2026-06-24T07:00:00.000Z",
  },
  {
    id: "todo-2",
    pet_id: "mock-pet-id",
    task_name: "お散歩　8時半",
    is_completed: false,
    completed_by_id: null,
    completed_by: null,
    completed_at: null,
    todo_date: "2026-06-24",
    created_at: "2026-06-24T07:00:00.000Z",
  },
  {
    id: "todo-3",
    pet_id: "mock-pet-id",
    task_name: "目薬（お散歩の後）",
    is_completed: false,
    completed_by_id: null,
    completed_by: null,
    completed_at: null,
    todo_date: "2026-06-24",
    created_at: "2026-06-24T07:00:00.000Z",
  },
];

export const MOCK_SCHEDULES: Schedule[] = [
  {
    id: "schedule-1",
    pet_id: "mock-pet-id",
    title: "狂犬病ワクチン",
    scheduled_content: null,
    scheduled_date: "2026-07-01",
    is_completed: false,
    created_at: "2025-07-01T00:00:00.000Z",
  },
  {
    id: "schedule-2",
    pet_id: "mock-pet-id",
    title: "フィラリア薬",
    scheduled_content: "毎月15日に投与。体重5kgのため1錠。",
    scheduled_date: "2026-07-15",
    is_completed: false,
    created_at: "2026-06-15T00:00:00.000Z",
  },
];