import { useRef, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import {
  INVITE_ERROR_MESSAGES,
  INVITE_ERROR_FALLBACK,
} from "./inviteErrorMessages";
import type { RegisterFormValues } from "../page";

type InviteError = { title: string; description: string };

export function useRegisterSubmit(inviteToken: string | null) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isEmailDuplicateError, setIsEmailDuplicateError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<InviteError | null>(null);
  // レンダリングを待たずに即座に参照できる二重送信防止用ガード
  const isSubmittingRef = useRef(false);

  const clearInviteError = () => setInviteError(null);

  // 戻り値: 成功したら true、失敗したら false（呼び出し側で遷移を判断する）
  const submit = async (values: RegisterFormValues): Promise<boolean> => {
    if (isSubmittingRef.current) return false;
    isSubmittingRef.current = true;

    setAuthError(null);
    setIsEmailDuplicateError(false);
    setIsSubmitting(true);

    // ① Supabase Authでアカウント作成
    const { error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });

    if (signUpError) {
      const isDuplicate = signUpError.code === "user_already_exists";

      setAuthError(
        isDuplicate
          ? "このメールアドレスはすでに登録されています。すでにアカウントをお持ちの場合はログインをお試しください。解決しない場合はお問い合わせください。"
          : signUpError.message ||
              "登録に失敗しました。時間をおいて再度お試しください。",
      );
      setIsEmailDuplicateError(isDuplicate);
      setIsSubmitting(false);
      isSubmittingRef.current = false;
      return false;
    }

    // ② JIT同期APIを1度だけ呼び出す
    try {
      await apiFetch("/api/auth/sync", { method: "POST" });

      // display_nameを更新
      await apiFetch("/api/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ display_name: values.displayName }),
      });
    } catch (err) {
      setAuthError(
        err instanceof ApiError
          ? err.message
          : "通信エラーが発生しました。時間をおいて再度お試しください。",
      );
      setIsSubmitting(false);
      isSubmittingRef.current = false;
      return false;
    }

    // ③ ペット情報を登録（招待経由の場合はスキップ：招待受諾でpet_idがセットされるため）
    if (!inviteToken) {
      try {
        for (const pet of values.pets) {
          await apiFetch("/api/pets", {
            method: "POST",
            body: JSON.stringify(pet),
          });
        }
      } catch (err) {
        setAuthError(
          err instanceof ApiError
            ? err.message
            : "ペット情報の登録に失敗しました。時間をおいて再度お試しください。",
        );
        setIsSubmitting(false);
        isSubmittingRef.current = false;
        return false;
      }
    }

    // ④ 招待URL経由の場合、トークンをパスパラメータとして送信
    if (inviteToken) {
      try {
        await apiFetch(`/api/invitations/${inviteToken}/accept`, {
          method: "POST",
        });
      } catch (err) {
        const errorContent =
          err instanceof ApiError && INVITE_ERROR_MESSAGES[err.code]
            ? INVITE_ERROR_MESSAGES[err.code]
            : INVITE_ERROR_FALLBACK;
        setInviteError(errorContent);
        setIsSubmitting(false);
        isSubmittingRef.current = false;
        return false;
      }
    }

    // 成功時はページ遷移するため isSubmittingRef のリセットは不要
    return true;
  };

  return {
    authError,
    isEmailDuplicateError,
    isSubmitting,
    inviteError,
    clearInviteError,
    submit,
  };
}
