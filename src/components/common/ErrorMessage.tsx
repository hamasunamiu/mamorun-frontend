import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * バックエンドAPI設計書で定義されているエラーコードと、
 * フロントエンドで表示する日本語メッセージの対応表。
 * 新しいエラーコードが追加された場合は、ここに追記する。
 */
const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "認証に失敗しました。再度ログインしてください。",
  FORBIDDEN: "この操作を行う権限がありません。",
  FORBIDDEN_DELETE: "自分が投稿したものだけを削除できます。",
  INVALID_INVITE_TOKEN: "この招待リンクは無効です。",
  INVITE_TOKEN_GONE: "この招待リンクは有効期限が切れているか、すでに使用されています。",
  ALREADY_PAIRED: "すでにこのペットの家族メンバーに登録されています。",
  FAMILY_LIMIT_REACHED: "家族の登録上限（最大4人）に達しているため参加できません。",
  AI_LIMIT_EXCEEDED: "本日の無料利用回数に達しました。プレミアムプランへのアップグレードをご検討ください。",
  INVALID_SPECIES: "犬または猫を選択してください。",
  INVALID_NOTIFICATION_TIME: "通知タイミングを選択してください。",
} as const;

const DEFAULT_MESSAGE = "エラーが発生しました。時間をおいて再度お試しください。";

type ErrorMessageProps = {
  /** バックエンドAPIが返すエラーコード（例: "UNAUTHORIZED"） */
  code?: string;
  /** エラーコードに対応するメッセージがない場合、または直接文言を渡したい場合 */
  message?: string;
  /** 追加のクラス名 */
  className?: string;
};

export function ErrorMessage({ code, message, className }: ErrorMessageProps) {
  const displayMessage = message ?? (code && ERROR_MESSAGES[code]) ?? DEFAULT_MESSAGE;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive",
        className
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{displayMessage}</span>
    </div>
  );
}