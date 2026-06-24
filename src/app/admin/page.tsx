import { Header } from "@/components/common/Header";
import { PrimaryButton } from "@/components/common/PrimaryButton";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#FFF9F5]">
      <Header
        title="管理画面"
        rightSlot={
          <span className="bg-[#712B13] text-white text-xs font-medium px-3 py-1 rounded-full">
            管理者
          </span>
        }
      />
      <div className="p-4 flex flex-col gap-3">
        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-[#FAECE7] rounded-xl flex items-center justify-center text-lg">
              👥
            </div>
            <span className="text-sm text-gray-500">総ユーザー数</span>
          </div>
          <p className="text-4xl font-medium text-[#D85A30]">
            12 <span className="text-base text-[#993C1D]">人</span>
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-[#FAECE7] rounded-xl flex items-center justify-center text-lg">
              🐾
            </div>
            <span className="text-sm text-gray-500">登録ペット数</span>
          </div>
          <p className="text-4xl font-medium text-[#D85A30] mb-3">
            8 <span className="text-base text-[#993C1D]">匹</span>
          </p>
          <div className="flex gap-2">
            <div className="flex-1 bg-[#FFF9F5] rounded-lg px-3 py-2 flex justify-between text-sm">
              <span>🐶 犬</span>
              <span className="font-medium text-[#D85A30]">5匹</span>
            </div>
            <div className="flex-1 bg-[#FFF9F5] rounded-lg px-3 py-2 flex justify-between text-sm">
              <span>🐱 猫</span>
              <span className="font-medium text-[#D85A30]">3匹</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-[#FAECE7] rounded-xl flex items-center justify-center text-lg">
              👑
            </div>
            <span className="text-sm text-gray-500">プレミアム会員数</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-4xl font-medium text-[#D85A30]">
              3 <span className="text-base text-[#993C1D]">人</span>
            </p>
            <span className="bg-[#FAECE7] text-[#993C1D] text-sm font-medium px-3 py-1 rounded-full">
              有料率 25%
            </span>
          </div>
        </div>
        {/* PrimaryButtonに置き換え */}
        <PrimaryButton className="w-full border border-[#e0d6ce] bg-transparent text-gray-500 hover:bg-gray-50">
          ログアウト
        </PrimaryButton>
      </div>
    </div>
  );
}
