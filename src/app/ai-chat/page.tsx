import { Header } from "@/components/common/Header";
import { BottomNavigation } from "@/components/common/BottomNavigation";

export default function AiChatPage() {
  return (
    <div className="min-h-screen bg-[#FFF9F5] flex flex-col pb-16">
      <Header title="獣医師AI相談" />

      <div className="flex-1 p-4 flex flex-col gap-3">

        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-[#FAECE7] border border-[#e0c4b0] flex items-center justify-center text-sm flex-shrink-0">🩺</div>
          <div className="bg-white border border-[#e0d6ce] rounded-tl-none rounded-2xl px-3 py-2.5 text-sm text-gray-800 leading-relaxed max-w-[75%]">
            こんにちは！むぎちゃんのことで気になることがあれば何でも聞いてください🐾
          </div>
        </div>

        <div className="flex justify-end">
          <div className="bg-[#D85A30] rounded-br-none rounded-2xl px-3 py-2.5 text-sm text-white leading-relaxed max-w-[75%]">
            最近少し食欲が落ちている気がします。
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-[#FAECE7] border border-[#e0c4b0] flex items-center justify-center text-sm flex-shrink-0">🩺</div>
          <div className="bg-white border border-[#e0d6ce] rounded-tl-none rounded-2xl px-3 py-2.5 text-sm text-gray-800 leading-relaxed max-w-[75%]">
            気温の変化が影響している可能性があります。2〜3日様子を見てみてください。
          </div>
        </div>

      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-[#e0d6ce] px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            placeholder="気になることを入力..."
            rows={2}
            className="flex-1 border border-[#e0d6ce] rounded-xl px-3 py-2.5 text-sm bg-[#FFF9F5] outline-none resize-none leading-relaxed"
          />
          <button className="w-10 h-10 rounded-full bg-[#D85A30] flex items-center justify-center text-white flex-shrink-0">
            ➤
          </button>
        </div>
        <p className="text-xs text-gray-400 text-right mt-1">0 / 500</p>
      </div>

      <div className="fixed bottom-0 left-0 right-0">
        <BottomNavigation />
      </div>
    </div>
  )
}
