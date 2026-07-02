import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiFetch, ApiError } from "@/lib/api-client";

type LoginCredentials = {
  email: string;
  password: string;
};

export function useLoginSubmit() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // レンダリングを待たずに即座に参照できる二重送信防止用ガード
  const isSubmittingRef = useRef(false);

  const onSubmit = async (values: LoginCredentials) => {
    // 連続クリック・連続Enterによる二重送信を防止
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setAuthError(null);
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setAuthError("メールアドレスまたはパスワードが正しくありません");
      setIsSubmitting(false);
      isSubmittingRef.current = false;
      return;
    }

    // ログイン成功直後、JIT同期APIを1度だけ呼び出す（バックエンド要求②準拠）
    try {
      await apiFetch("/api/auth/sync", { method: "POST" });
    } catch (err) {
      if (err instanceof ApiError) {
        setAuthError(err.message);
      } else {
        setAuthError(
          "通信エラーが発生しました。時間をおいて再度お試しください。",
        );
      }
      setIsSubmitting(false);
      isSubmittingRef.current = false;
      return;
    }

    //管理者かどうかを判定
    try {
      await apiFetch("/api/admin/stats");
      router.push("/admin");
      return;
    } catch {
      //管理者でない場合（４０４）は通常フローへ
    }

    router.push("/home");
    // 成功時はページ遷移するため isSubmittingRef のリセットは不要
  };

  return { onSubmit, authError, isSubmitting };
}
