import { Header } from "@/components/common/Header";
import { BottomNavigation } from "@/components/common/BottomNavigation";
import { PrimaryButton } from "@/components/common/PrimaryButton";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#FFF9F5] pb-20">
      <Header title="設定" />

      <div className="p-4 flex flex-col gap-3">
        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <p className="text-xs font-medium text-[#993C1D] mb-3">
            👤 アカウント情報
          </p>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-gray-500">メールアドレス</span>
            <span className="text-xs text-gray-700">mano@example.com</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-gray-500">プラン</span>
            <span className="bg-[#f0ece8] border border-[#e0d6ce] text-[#888780] text-xs font-medium px-3 py-1 rounded-full">
              無料プラン
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <p className="text-xs font-medium text-[#993C1D] mb-3">
            🔔 LINE通知タイミング
          </p>
          <p className="text-xs text-gray-500 mb-2">
            リマインドを受け取る時間帯
          </p>
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 rounded-lg border border-[#D85A30] bg-[#FAECE7] text-sm text-[#993C1D] font-medium">
              朝（08:00）
            </button>
            <button className="flex-1 py-2.5 rounded-lg border border-[#e0d6ce] bg-[#FFF9F5] text-sm text-gray-500">
              夜（20:00）
            </button>
          </div>
        </div>

        {/* ① ペットを追加する（独立カード） */}
        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <p className="text-xs font-medium text-[#993C1D] mb-3">
            🐾 ペットを追加する
          </p>
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3 text-sm text-gray-800">
              <div className="w-8 h-8 bg-[#FAECE7] rounded-lg flex items-center justify-center">
                ➕
              </div>
              新しいペットを登録する
            </div>
            <span className="text-gray-400">›</span>
          </div>
        </div>

        {/* ① 家族を招待する（独立カード） */}
        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <p className="text-xs font-medium text-[#993C1D] mb-3">
            👥 家族を招待する
          </p>
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3 text-sm text-gray-800">
              <div className="w-8 h-8 bg-[#FAECE7] rounded-lg flex items-center justify-center">
                👥
              </div>
              招待URLを発行する
            </div>
            <span className="text-gray-400">›</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <p className="text-xs font-medium text-[#993C1D] mb-3">
            ⭐ プレミアムプラン
          </p>
          <p className="text-sm text-gray-500 leading-relaxed mb-3">
            AI相談が無制限・LINE通知が使えるようになります。
          </p>
          {/* ② PrimaryButtonに置き換え */}
          <PrimaryButton className="w-full">
            👑 プレミアムにアップグレード
          </PrimaryButton>
        </div>

        {/* ② PrimaryButtonに置き換え */}
        <PrimaryButton className="w-full border border-[#e0d6ce] bg-transparent text-gray-500 hover:bg-gray-50">
          ログアウト
        </PrimaryButton>
      </div>

      <div className="fixed bottom-0 left-0 right-0">
        <BottomNavigation />
      </div>
    </div>
  );
}
