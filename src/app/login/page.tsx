"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, Link as LinkIcon, ShieldCheck } from "lucide-react";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { supabase } from "@/lib/supabase";
import { apiFetch, ApiError } from "@/lib/api-client";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("正しいメールアドレスの形式で入力してください"),
  password: z
    .string()
    .min(1, "パスワードを入力してください")
    .min(8, "8文字以上で入力してください"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null);
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setAuthError("メールアドレスまたはパスワードが正しくありません");
      setIsSubmitting(false);
      return;
    }

    // ログイン成功直後、JIT同期APIを1度だけ呼び出す（バックエンド要求②準拠）
    try {
      await apiFetch("/api/auth/sync", { method: "POST" });
    } catch (err) {
      if (err instanceof ApiError) {
        setAuthError(err.message);
      } else {
        setAuthError("通信エラーが発生しました。時間をおいて再度お試しください。");
      }
      setIsSubmitting(false);
      return;
    }

    router.push("/home");
  };

  return (
    <main className="min-h-screen bg-[#FAF8F6]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-8">
        {/* 上部イラスト */}
        <div className="mt-6 flex justify-center">
          <Image
            src="/images/login-screen-design.png"
            alt="ベッドで眠る犬と猫のイラスト"
            width={360}
            height={320}
            priority
            className="h-auto w-72"
          />
        </div>

        {/* アプリ名 */}
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl text-[#C69A6B]">🐾</span>
            <h1 className="text-2xl font-bold text-[#5C4631]">おせわノート</h1>
          </div>
          <p className="mt-1 text-sm text-[#9E7654]">
            〜 大切な家族を、みんなで見守る 〜
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-[#5C4631]">
              メールアドレス
            </label>
            <div className="relative mt-1">
              <Mail
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C69A6B]"
                aria-hidden="true"
              />
              <input
                {...register("email")}
                type="email"
                placeholder="メールアドレスを入力してください"
                className="h-12 w-full rounded-xl border border-[#D8C0A8] bg-white pl-10 pr-3 text-sm placeholder:text-[#C9B6A3] focus:outline-none focus:ring-2 focus:ring-[#C69A6B]"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-[#5C4631]">パスワード</label>
            <div className="relative mt-1">
              <Lock
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C69A6B]"
                aria-hidden="true"
              />
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="パスワードを入力してください"
                className="h-12 w-full rounded-xl border border-[#D8C0A8] bg-white pl-10 pr-10 text-sm placeholder:text-[#C9B6A3] focus:outline-none focus:ring-2 focus:ring-[#C69A6B]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示する"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C69A6B]"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {authError && <ErrorMessage message={authError} />}

          <PrimaryButton
            type="submit"
            showPaw
            disabled={isSubmitting}
            className="mt-2 h-14 rounded-3xl bg-[#C69A6B] text-base hover:bg-[#C69A6B] hover:opacity-85"
          >
            {isSubmitting ? <LoadingSpinner size="sm" /> : "ログイン"}
          </PrimaryButton>
        </form>

        {/* 新規登録 */}
        <p className="mt-6 text-center text-sm text-[#9E7654]">
          アカウントをお持ちでない方は{" "}
          <Link href="/register" className="font-semibold text-[#C2693C] underline">
          新規登録
          </Link>
        </p>

        {/* 区切り */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-[#D8C0A8]" />
          <span className="text-sm text-[#C69A6B]">または</span>
          <div className="h-px flex-1 bg-[#D8C0A8]" />
        </div>

        {/* 招待URL */}
        <Link
          href="/invitations/accept"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-3xl border border-[#D8C0A8] bg-white text-sm font-semibold text-[#C69A6B]"
        >
          <LinkIcon className="h-4 w-4" aria-hidden="true" />
          招待URLをお持ちの方
        </Link>

        {/* 安心・安全のために */}
        <div className="relative mt-6 overflow-hidden rounded-2xl bg-[#FDF1E2] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#C69A6B]" aria-hidden="true" />
            <div className="pr-12">
              <p className="text-sm font-semibold text-[#6E5849]">安心・安全のために</p>
              <p className="mt-1 text-xs leading-relaxed text-[#9E7654]">
                お世話の情報を家族で共有し、もしもの時もすぐに連絡できる安心のアプリです。
              </p>
            </div>
          </div>
          <Image
            src="/images/login-heart.png"
            alt=""
            width={70}
            height={58}
            className="absolute bottom-2 right-2 h-12 w-14"
          />
        </div>
      </div>
    </main>
  );
}