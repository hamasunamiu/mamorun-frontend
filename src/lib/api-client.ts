import { supabase } from "./supabase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * バックエンドAPIへの認証付きリクエストを行う共通関数。
 * - Supabaseの現在のセッションからJWTを取得し、Authorizationヘッダーへ自動付与する
 * - 401/403エラーを検出した場合、共通ハンドリング（onUnauthorized）に処理を委ねる
 *
 * 重要：このファイルはANON_KEYのみを使うsupabaseクライアント経由でJWTを取得する。
 * SERVICE_ROLE_KEYはバックエンドのみが使用し、フロントには絶対に渡さない。
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401 || response.status === 403) {
    handleUnauthorized(response.status);
    throw new ApiError(
      response.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
      "認証エラーが発生しました。",
      response.status
    );
  }

  const json = await response.json();

  if (!response.ok) {
    throw new ApiError(
      json.error?.code ?? "UNKNOWN_ERROR",
      json.error?.message ?? "エラーが発生しました。",
      response.status
    );
  }

  return json.data as T;
}

/**
 * 401/403エラー時の共通リダイレクト処理。
 * - 401（未認証）：ログイン画面へ
 * - 403（権限不足）：ペット未登録の可能性が高いため、ホーム画面へ（Next.js Middleware側でpet_id=nullを判定しUI-001へ誘導する設計と連携）
 */
function handleUnauthorized(status: number) {
  if (typeof window === "undefined") return;

  if (status === 401) {
    window.location.href = "/login";
  } else if (status === 403) {
    window.location.href = "/home";
  }
}