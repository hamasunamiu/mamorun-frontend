import { Header } from "@/components/common/Header";
import { BottomNavigation } from "@/components/common/BottomNavigation";

export default function TimelinePage() {
  return (
    <div className="min-h-screen bg-[#FFF9F5] pb-20">
      <Header
        petName="むぎ"
        dateLabel="6月23日（月）"
      />

      <div className="p-4 flex flex-col gap-3">

        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <p className="text-sm font-medium text-[#993C1D] mb-3">✏️ 今日の記録を追加</p>
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">タイトル <span className="text-[#D85A30]">必須</span></p>
            <input type="text" placeholder="例：朝の体調チェック" className="w-full border border-[#e0d6ce] rounded-lg px-3 py-2.5 text-sm bg-[#FFF9F5] outline-none" />
          </div>
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">体調メモ <span className="text-[#b0a090]">任意</span></p>
            <textarea placeholder="例：食欲あり、元気です" rows={2} className="w-full border border-[#e0d6ce] rounded-lg px-3 py-2.5 text-sm bg-[#FFF9F5] outline-none resize-none" />
          </div>
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">写真 <span className="text-[#b0a090]">任意</span></p>
            <div className="w-full h-20 border border-dashed border-[#e0a080] rounded-lg bg-[#FFF9F5] flex items-center justify-center gap-2 text-sm text-[#993C1D]">
              📷 写真を追加する
            </div>
          </div>
          <button className="w-full py-3 rounded-xl bg-[#D85A30] text-white text-sm font-medium">投稿する</button>
        </div>

        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-[#FAECE7] flex items-center justify-center text-xs font-medium text-[#993C1D]">ま</div>
            <div>
              <p className="text-xs font-medium text-[#993C1D]">まの</p>
              <p className="text-xs text-gray-400">6月12日 08:32</p>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-800 mb-1">朝の散歩、元気いっぱい！</p>
          <div className="w-full h-32 bg-[#f5ede8] rounded-lg flex items-center justify-center mb-2">
            <span className="text-3xl">🐾</span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed mb-3">今日はいつもより長めに歩いた。食欲も普通。うんちは1回、問題なし。</p>
          <div className="flex justify-end border-t border-[#f0e8e0] pt-2">
            <button className="text-xs text-gray-400">🗑 削除</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e0d6ce] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-[#FAECE7] flex items-center justify-center text-xs font-medium text-[#993C1D]">ゆ</div>
            <div>
              <p className="text-xs font-medium text-[#993C1D]">ゆい</p>
              <p className="text-xs text-gray-400">6月11日 21:15</p>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-800 mb-1">夜ごはん完食🍚</p>
          <p className="text-sm text-gray-500 leading-relaxed">いつも通り完食。元気そう。薬も問題なく飲めた。</p>
        </div>

      </div>

      <div className="fixed bottom-0 left-0 right-0">
        <BottomNavigation />
      </div>
    </div>
  )
}
