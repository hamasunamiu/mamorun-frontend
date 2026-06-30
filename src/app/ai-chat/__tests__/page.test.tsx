import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AiChatPage from "../page";
import { apiFetch } from "@/lib/api-client";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/ai-chat",
}));

jest.mock("@/lib/api-client", () => ({
  apiFetch: jest.fn(),
  ApiError: class ApiError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

// localStorageをモック化
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

const mockUsage = {
  used_count: 0,
  remaining_count: 3,
  is_premium: false,
};

const mockProfile = {
  id: "profile-1",
  pet_id: "pet-1",
};

const mockPet = {
  id: "pet-1",
  name: "むぎ",
  gender: "male",
};

describe("AiChatPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();

    (apiFetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/ai/usage") return Promise.resolve(mockUsage);
      if (url === "/api/profiles/me") return Promise.resolve(mockProfile);
      if (url.startsWith("/api/pets/")) return Promise.resolve(mockPet);
      return Promise.resolve({});
    });
  });

  describe("AiChatPage", () => {
    describe("初期表示", () => {
      test("UT-F-401: 初期AIメッセージが表示される", async () => {
        render(<AiChatPage />);
        expect(
          await screen.findByText(
            "こんにちは！むぎくんのことで気になることがあれば何でも聞いてください🐾",
          ),
        ).toBeInTheDocument();
      });

      test("UT-F-402: 無料会員の場合、残り回数バッジが表示される", async () => {
        render(<AiChatPage />);
        expect(
          await screen.findByText(
            (content, element) =>
              element?.tagName.toLowerCase() === "span" &&
              element?.textContent === "本日の残り相談回数：3 / 3回",
          ),
        ).toBeInTheDocument();
      });
    });

    describe("送信ボタン制御", () => {
      test("UT-F-403: 入力欄が空の場合、送信ボタンがdisabled", async () => {
        render(<AiChatPage />);
        await screen.findByText(/こんにちは/);
        expect(screen.getByRole("button", { name: "送信" })).toBeDisabled();
      });

      test("UT-F-404: 入力欄が500文字を超える場合、送信ボタンがdisabled", async () => {
        const user = userEvent.setup();
        render(<AiChatPage />);
        await screen.findByText(/こんにちは/);

        await user.type(
          screen.getByPlaceholderText("気になることを入力..."),
          "あ".repeat(501),
        );

        expect(screen.getByRole("button", { name: "送信" })).toBeDisabled();
      }, 15000);

      test("UT-F-405: 入力欄が500文字ちょうどの場合（境界値）、送信ボタンが有効", async () => {
        const user = userEvent.setup();
        render(<AiChatPage />);
        await screen.findByText(/こんにちは/);

        await user.type(
          screen.getByPlaceholderText("気になることを入力..."),
          "あ".repeat(500),
        );

        expect(screen.getByRole("button", { name: "送信" })).not.toBeDisabled();
      }, 15000);
    });

    describe("送信（正常系）", () => {
      beforeEach(() => {
        (apiFetch as jest.Mock).mockImplementation(
          (url: string, options?: RequestInit) => {
            if (url === "/api/ai/usage") return Promise.resolve(mockUsage);
            if (url === "/api/profiles/me") return Promise.resolve(mockProfile);
            if (url.startsWith("/api/pets/")) return Promise.resolve(mockPet);
            if (url === "/api/ai/chat") {
              return Promise.resolve({
                reply: "1日の適量は体重や運動量によって異なります。",
                remaining_count: 2,
              });
            }
            return Promise.resolve({});
          },
        );
      });

      test("UT-F-406: 入力してメッセージを送信するとユーザーメッセージが追加される", async () => {
        const user = userEvent.setup();
        render(<AiChatPage />);
        await screen.findByText(/こんにちは/);

        await user.type(
          screen.getByPlaceholderText("気になることを入力..."),
          "ごはんの量は？",
        );
        await user.click(screen.getByRole("button", { name: "送信" }));

        expect(screen.getByText("ごはんの量は？")).toBeInTheDocument();
      });

      test("UT-F-407: 送信後にAIの返答が追加される", async () => {
        const user = userEvent.setup();
        render(<AiChatPage />);
        await screen.findByText(/こんにちは/);

        await user.type(
          screen.getByPlaceholderText("気になることを入力..."),
          "ごはんの量は？",
        );
        await user.click(screen.getByRole("button", { name: "送信" }));

        expect(
          await screen.findByText(
            "1日の適量は体重や運動量によって異なります。",
          ),
        ).toBeInTheDocument();
      });

      test("UT-F-408: 送信後に入力欄がクリアされる", async () => {
        const user = userEvent.setup();
        render(<AiChatPage />);
        await screen.findByText(/こんにちは/);

        const textarea = screen.getByPlaceholderText("気になることを入力...");
        await user.type(textarea, "ごはんの量は？");
        await user.click(screen.getByRole("button", { name: "送信" }));

        expect(textarea).toHaveValue("");
      });

      test("UT-F-409: 送信後に残り回数がAPIレスポンスの値に更新される", async () => {
        const user = userEvent.setup();
        render(<AiChatPage />);
        await screen.findByText(/こんにちは/);

        await user.type(
          screen.getByPlaceholderText("気になることを入力..."),
          "ごはんの量は？",
        );
        await user.click(screen.getByRole("button", { name: "送信" }));

        expect(
          await screen.findByText(
            (content, element) =>
              element?.tagName.toLowerCase() === "span" &&
              element?.textContent === "本日の残り相談回数：2 / 3回",
          ),
        ).toBeInTheDocument();
      });
    });

    describe("上限・モーダル", () => {
      test("UT-F-410: 残り回数が0の状態で送信するとプレミアムモーダルが表示される", async () => {
        const user = userEvent.setup();
        (apiFetch as jest.Mock).mockImplementation((url: string) => {
          if (url === "/api/ai/usage")
            return Promise.resolve({ ...mockUsage, remaining_count: 0 });
          if (url === "/api/profiles/me") return Promise.resolve(mockProfile);
          if (url.startsWith("/api/pets/")) return Promise.resolve(mockPet);
          return Promise.resolve({});
        });

        render(<AiChatPage />);
        await screen.findByText(/こんにちは/);

        await user.type(
          screen.getByPlaceholderText("気になることを入力..."),
          "質問です",
        );
        await user.click(screen.getByRole("button", { name: "送信" }));

        expect(
          await screen.findByText("本日の無料相談回数に達しました"),
        ).toBeInTheDocument();
      });

      test("UT-F-411: モーダルの「閉じる」ボタンクリックでモーダルが閉じる", async () => {
        const user = userEvent.setup();
        (apiFetch as jest.Mock).mockImplementation((url: string) => {
          if (url === "/api/ai/usage")
            return Promise.resolve({ ...mockUsage, remaining_count: 0 });
          if (url === "/api/profiles/me") return Promise.resolve(mockProfile);
          if (url.startsWith("/api/pets/")) return Promise.resolve(mockPet);
          return Promise.resolve({});
        });

        render(<AiChatPage />);
        await screen.findByText(/こんにちは/);

        await user.type(
          screen.getByPlaceholderText("気になることを入力..."),
          "質問です",
        );
        await user.click(screen.getByRole("button", { name: "送信" }));

        await screen.findByText("本日の無料相談回数に達しました");
        await user.click(screen.getByRole("button", { name: "閉じる" }));

        await waitFor(() => {
          expect(
            screen.queryByText("本日の無料相談回数に達しました"),
          ).not.toBeInTheDocument();
        });
      });
    });

    describe("文字数カウント", () => {
      test("UT-F-412: 入力文字数が「{n} / 500」形式でリアルタイム表示される", async () => {
        const user = userEvent.setup();
        render(<AiChatPage />);
        await screen.findByText(/こんにちは/);

        expect(
          screen.getByText((content, element) => {
            return element?.textContent === "0 / 500";
          }),
        ).toBeInTheDocument();

        await user.type(
          screen.getByPlaceholderText("気になることを入力..."),
          "あいう",
        );

        expect(
          screen.getByText((content, element) => {
            return element?.textContent === "3 / 500";
          }),
        ).toBeInTheDocument();
      });
    });
  });
});
