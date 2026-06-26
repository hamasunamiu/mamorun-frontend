// ============================================================
// アプリ全体で共有する型定義
// ============================================================

export type Profile = {
  id: string;
  line_user_id: string | null;
  is_premium: boolean;
  stripe_customer_id: string | null;
  pet_id: string | null;
  notification_time: "morning" | "night";
  created_at: string;
};

export type Pet = {
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

export type Todo = {
  id: string;
  pet_id: string;
  task_name: string;
  is_completed: boolean;
  completed_by_id: string | null;
  completed_at: string | null;
  todo_date: string;
  created_at: string;
};

export type Schedule = {
  id: string;
  pet_id: string;
  title: string;
  scheduled_content: string | null;
  scheduled_date: string;
  is_completed: boolean;
  created_at: string;
};