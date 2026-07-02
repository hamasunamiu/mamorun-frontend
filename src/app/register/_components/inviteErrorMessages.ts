export const INVITE_ERROR_MESSAGES: Record<
  string,
  { title: string; description: string }
> = {
  INVALID_INVITE_TOKEN: {
    title: "招待リンクが無効です",
    description: "無効な招待URLです。",
  },
  INVITE_TOKEN_GONE: {
    title: "招待リンクの有効期限が切れています",
    description:
      "この招待リンクは有効期限が切れているか、すでに使用されています。",
  },
  ALREADY_PAIRED: {
    title: "すでに参加済みです",
    description: "既にこのペットの家族メンバーに登録されています。",
  },
  FAMILY_LIMIT_REACHED: {
    title: "招待を受け付けられません",
    description: "家族の登録上限（最大4人）に達しているため参加できません。",
  },
};

export const INVITE_ERROR_FALLBACK = {
  title: "エラーが発生しました",
  description: "通信エラーが発生しました。時間をおいて再度お試しください。",
};
