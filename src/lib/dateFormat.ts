/**
 * 日付を「2026年6月24日（火）」形式の表示用文字列に変換する
 */
export function formatDateLabel(date: Date): string {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  return `${year}年${month}月${day}日（${weekday}）`;
}

/**
 * 予定日までの残り日数を「あと◯日」「今日」「期限切れ」の形式で返す
 */
export function formatDaysUntil(scheduledDate: string, today: Date): string {
  // 時刻部分の差異で日数がズレないよう、両方を「日付のみ」に正規化して比較する
  const target = new Date(scheduledDate + "T00:00:00");
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const diffMs = target.getTime() - todayMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "今日";
  if (diffDays < 0) return "期限切れ";
  return `あと${diffDays}日`;
}