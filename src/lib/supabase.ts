import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * フロントエンド専用のSupabaseクライアント。
 * 必ず ANON_KEY のみを使用する（SERVICE_ROLE_KEYは絶対に使用しない）。
 * 用途：認証（ログイン・新規登録）、Realtime通知の受信。
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);