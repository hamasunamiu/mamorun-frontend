import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AiChatPage from "../page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/ai-chat",
}));

describe("AiChatPage", () => {
  describe("初期表示", () => {
    test("UT-F-401: 初期AIメッセージが表示される", () => {
      render(<AiChatPage />);
      expect(
        screen.getByText(
          "こんにちは！むぎちゃんのことで気になることがあれば何でも聞いてください🐾",
        ),
      ).toBeInTheDocument();
    });

    test("UT-F-402: 無料会員の場合、残り回数バッジが表示される", () => {
      render(<AiChatPage />);
      expect(
        screen.getByText("本日の残り相談回数：3 / 3回"),
      ).toBeInTheDocument();
    });
  });

  describe("送信ボタン制御", () => {
    test("UT-F-403: 入力欄が空の場合、送信ボタンがdisabled", () => {
      render(<AiChatPage />);
      expect(screen.getByRole("button", { name: "送信" })).toBeDisabled();
    });

    test("UT-F-404: 入力欄が500文字を超える場合、送信ボタンがdisabled", async () => {
      const user = userEvent.setup();
      render(<AiChatPage />);

      await user.type(
        screen.getByPlaceholderText("気になることを入力..."),
        "あ".repeat(501),
      );

      expect(screen.getByRole("button", { name: "送信" })).toBeDisabled();
    }, 15000);

    test("UT-F-405: 入力欄が500文字ちょうどの場合（境界値）、送信ボタンが有効", async () => {
      const user = userEvent.setup();
      render(<AiChatPage />);

      await user.type(
        screen.getByPlaceholderText("気になることを入力..."),
        "あ".repeat(500),
      );

      expect(screen.getByRole("button", { name: "送信" })).not.toBeDisabled();
    }, 15000);
  });

  describe("送信（正常系）", () => {
    test("UT-F-406: 入力してメッセージを送信するとユーザーメッセージが追加される", async () => {
      const user = userEvent.setup();
      render(<AiChatPage />);

      await user.type(
        screen.getByPlaceholderText("気になることを入力..."),
        "ごはんの量は？",
      );
      await user.click(screen.getByRole("button", { name: "送信" }));

      expect(screen.getByText("ごはんの量は？")).toBeInTheDocument();
    });

    test("UT-F-407: 送信後にAIのダミー返答が追加される", async () => {
      const user = userEvent.setup();
      render(<AiChatPage />);

      await user.type(
        screen.getByPlaceholderText("気になることを入力..."),
        "ごはんの量は？",
      );
      await user.click(screen.getByRole("button", { name: "送信" }));

      expect(
        screen.getByText("（AIの返答がここに表示されます）"),
      ).toBeInTheDocument();
    });

    test("UT-F-408: 送信後に入力欄がクリアされる", async () => {
      const user = userEvent.setup();
      render(<AiChatPage />);

      const textarea = screen.getByPlaceholderText("気になることを入力...");
      await user.type(textarea, "ごはんの量は？");
      await user.click(screen.getByRole("button", { name: "送信" }));

      expect(textarea).toHaveValue("");
    });

    test("UT-F-409: 送信後に残り回数が1減る", async () => {
      const user = userEvent.setup();
      render(<AiChatPage />);

      await user.type(
        screen.getByPlaceholderText("気になることを入力..."),
        "ごはんの量は？",
      );
      await user.click(screen.getByRole("button", { name: "送信" }));

      expect(
        screen.getByText("本日の残り相談回数：2 / 3回"),
      ).toBeInTheDocument();
    });
  });

  describe("上限・モーダル", () => {
    test("UT-F-410: 残り回数が0の状態で送信するとプレミアムモーダルが表示される", async () => {
      const user = userEvent.setup();
      render(<AiChatPage />);

      const textarea = screen.getByPlaceholderText("気になることを入力...");
      const submitButton = screen.getByRole("button", { name: "送信" });

      // 3回送信して残り回数を0にする
      for (let i = 0; i < 3; i++) {
        await user.type(textarea, `質問${i + 1}`);
        await user.click(submitButton);
      }

      // 4回目の送信でモーダルが開く
      await user.type(textarea, "4回目の質問");
      await user.click(submitButton);

      expect(
        await screen.findByText("本日の無料相談回数に達しました"),
      ).toBeInTheDocument();
    });

    test("UT-F-411: モーダルの「閉じる」ボタンクリックでモーダルが閉じる", async () => {
      const user = userEvent.setup();
      render(<AiChatPage />);

      const textarea = screen.getByPlaceholderText("気になることを入力...");
      const submitButton = screen.getByRole("button", { name: "送信" });

      for (let i = 0; i < 3; i++) {
        await user.type(textarea, `質問${i + 1}`);
        await user.click(submitButton);
      }

      await user.type(textarea, "4回目の質問");
      await user.click(submitButton);

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

      expect(screen.getByText("0 / 500")).toBeInTheDocument();

      await user.type(
        screen.getByPlaceholderText("気になることを入力..."),
        "あいう",
      );

      expect(screen.getByText("3 / 500")).toBeInTheDocument();
    });
  });
});
