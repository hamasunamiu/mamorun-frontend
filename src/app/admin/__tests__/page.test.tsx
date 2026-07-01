import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminPage from "../page";

const mockSignOut = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signOut: () => mockSignOut(),
    },
  },
}));

describe("AdminPage", () => {
  beforeEach(() => {
    mockSignOut.mockClear();
  });

  describe("初期表示", () => {
    test("UT-F-501: 総ユーザー数カードが表示される", () => {
      render(<AdminPage />);
      expect(screen.getByText("総ユーザー数")).toBeInTheDocument();
    });

    test("UT-F-502: 登録ペット数カードが表示される", () => {
      render(<AdminPage />);
      expect(screen.getByText("登録ペット数")).toBeInTheDocument();
    });

    test("UT-F-503: プレミアム会員数カードが表示される", () => {
      render(<AdminPage />);
      expect(screen.getByText("プレミアム会員数")).toBeInTheDocument();
    });

    test("UT-F-504: ヘッダーに「管理者」バッジが表示される", () => {
      render(<AdminPage />);
      expect(screen.getByText("管理者")).toBeInTheDocument();
    });
  });

  describe("ログアウト機能", () => {
    test("UT-F-505: ログアウトボタンクリックで確認モーダルが開く", async () => {
      const user = userEvent.setup();
      render(<AdminPage />);

      await user.click(screen.getByRole("button", { name: "ログアウト" }));

      expect(screen.getByText("ログアウトしますか？")).toBeInTheDocument();
    });

    test("UT-F-506: モーダルの「キャンセル」ボタンでモーダルが閉じる", async () => {
      const user = userEvent.setup();
      render(<AdminPage />);

      await user.click(screen.getByRole("button", { name: "ログアウト" }));
      await user.click(screen.getByRole("button", { name: "キャンセル" }));

      expect(
        screen.queryByText("ログアウトしますか？"),
      ).not.toBeInTheDocument();
    });

    test("UT-F-507: モーダル内の「ログアウト」ボタンでsignOutが呼ばれる", async () => {
      const user = userEvent.setup();
      render(<AdminPage />);

      await user.click(screen.getByRole("button", { name: "ログアウト" }));

      const dialog = screen.getByRole("dialog");
      await user.click(
        within(dialog).getByRole("button", { name: "ログアウト" }),
      );

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });
});
