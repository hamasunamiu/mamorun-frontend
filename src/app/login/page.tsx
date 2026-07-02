"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Modal } from "@/components/common/Modal";
import { Yomogi } from "next/font/google";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Link as LinkIcon,
  ShieldCheck,
  PawPrint,
} from "lucide-react";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { supabase } from "@/lib/supabase";
import { apiFetch, ApiError } from "@/lib/api-client";

const yomogi = Yomogi({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // レンダリングを待たずに即座に参照できる二重送信防止用ガード
  const isSubmittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
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

  return (
    <main className="min-h-screen bg-[#FAF8F6]">
      <div
        className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-6 py-8"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 2rem)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)",
        }}
      >
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
            <span className="text-2xl text-accent-foreground">🐾</span>
            <h1 className={`${yomogi.className} text-3xl text-foreground`}>
              まもるん
            </h1>
            <span className="text-2xl text-accent-foreground">🐾</span>
          </div>
          <p className="mt-1 text-sm text-accent-foreground">
            〜 大切な家族を、みんなで見守る 〜
          </p>
        </div>

        {/* フォーム */}
        <form
          noValidate
          // eslint-disable-next-line react-hooks/refs
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 flex flex-col gap-4"
        >
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              メールアドレス
            </label>
            <div className="relative mt-1">
              <Mail
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-foreground"
                aria-hidden="true"
              />
              <input
                id="email"
                {...register("email")}
                data-testid="ui001-email-input"
                type="email"
                placeholder="メールアドレスを入力してください"
                className="h-12 w-full rounded-xl border border-accent-foreground/30 bg-white pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              パスワード
            </label>
            <div className="relative mt-1">
              <Lock
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-foreground"
                aria-hidden="true"
              />
              <input
                id="password"
                {...register("password")}
                data-testid="ui001-password-input"
                type={showPassword ? "text" : "password"}
                placeholder="パスワードを入力してください"
                className="h-12 w-full rounded-xl border border-accent-foreground/30 bg-white pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={
                  showPassword ? "パスワードを隠す" : "パスワードを表示する"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {authError && <ErrorMessage message={authError} />}

          <PrimaryButton
            type="submit"
            data-testid="ui001-login-button"
            showPaw
            disabled={isSubmitting}
            className="mt-2 h-14 rounded-3xl text-base"
          >
            {isSubmitting ? <LoadingSpinner size="sm" /> : "ログイン"}
          </PrimaryButton>
        </form>

        {/* 新規登録 */}
        <p className="mt-6 text-center text-sm text-accent-foreground">
          アカウントをお持ちでない方は{" "}
          <Link
            href="/register"
            className="font-semibold text-primary-foreground underline"
          >
            新規登録
          </Link>
        </p>

        {/* 区切り */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-accent-foreground/30" />
          <span className="text-sm text-accent-foreground">または</span>
          <div className="h-px flex-1 bg-accent-foreground/30" />
        </div>

        {/* 招待URL */}
        <button
          type="button"
          onClick={() => setIsInviteModalOpen(true)}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-3xl border border-accent-foreground/30 bg-white text-sm font-semibold text-accent-foreground"
        >
          <LinkIcon className="h-4 w-4" aria-hidden="true" />
          招待URLをお持ちの方
        </button>

        {/* 安心・安全のために */}
        <div className="relative mt-6 overflow-hidden rounded-2xl bg-[#FDF1E2] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck
              className="mt-0.5 h-5 w-5 shrink-0 text-accent-foreground"
              aria-hidden="true"
            />
            <div className="pr-12">
              <p className="text-sm font-semibold text-foreground">
                安心・安全のために
              </p>
              <p className="mt-1 text-xs leading-relaxed text-accent-foreground">
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

      <Modal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        title="招待URLをお持ちの方"
        footer={
          <PrimaryButton
            className="w-full"
            onClick={() => setIsInviteModalOpen(false)}
          >
            閉じる
          </PrimaryButton>
        }
      >
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
            <PawPrint
              className="h-7 w-7 text-accent-foreground"
              aria-hidden="true"
            />
          </div>
          <p className="text-center text-sm leading-relaxed text-accent-foreground">
            家族から届いた招待URLをタップすると
            <br />
            専用の登録画面にご案内します。
            <br />
            <br />
            このボタンからは登録できないので
            <br />
            届いたURLからアクセスしてくださいね！
          </p>
        </div>
      </Modal>
    </main>
  );
}
