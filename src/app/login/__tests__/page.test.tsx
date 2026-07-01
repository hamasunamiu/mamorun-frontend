import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../page";
import { supabase } from "@/lib/supabase";
import { apiFetch, ApiError } from "@/lib/api-client";

// useRouterをモック化：router.push が呼ばれたかどうかを確認するため
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// supabaseをモック化：本物の通信を発生させないため
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));

// apiFetchをモック化：本物のバックエンド通信を発生させないため
jest.mock("@/lib/api-client", () => ({
  apiFetch: jest.fn(),
  ApiError: class ApiError extends Error {
    code: string;
    status: number;
    constructor(code: string, message: string, status: number) {
      super(message);
      this.code = code;
      this.status = status;
    }
  },
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("正常系", () => {
    test("UT-F-001: 正しいメール・パスワードでログインすると /home へ遷移する", async () => {
      const user = userEvent.setup();

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        error: null,
      });
      (apiFetch as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/admin/stats") {
          return Promise.reject(new ApiError("NOT_FOUND", "Not Found", 404));
        }
        return Promise.resolve({ data: {}, message: "success" });
      });

      render(<LoginPage />);

      await user.type(
        screen.getByPlaceholderText("メールアドレスを入力してください"),
        "test@example.com",
      );
      await user.type(
        screen.getByPlaceholderText("パスワードを入力してください"),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: "ログイン" }));

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });

      expect(apiFetch).toHaveBeenCalledWith("/api/auth/sync", {
        method: "POST",
      });
      expect(mockPush).toHaveBeenCalledWith("/home");
    });

    test("UT-F-006: パスワードが8文字（境界値）の場合バリデーションを通過する", async () => {
      const user = userEvent.setup();

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        error: null,
      });
      (apiFetch as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/admin/stats") {
          return Promise.reject(new ApiError("NOT_FOUND", "Not Found", 404));
        }
        return Promise.resolve({ data: {}, message: "success" });
      });

      render(<LoginPage />);

      await user.type(
        screen.getByPlaceholderText("メールアドレスを入力してください"),
        "test@example.com",
      );
      await user.type(
        screen.getByPlaceholderText("パスワードを入力してください"),
        "12345678",
      );
      await user.click(screen.getByRole("button", { name: "ログイン" }));

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "12345678",
        });
      });
    });
  });

  describe("バリデーション", () => {
    test("UT-F-002: メールアドレス未入力の場合エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(
        screen.getByPlaceholderText("パスワードを入力してください"),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: "ログイン" }));

      expect(
        await screen.findByText("メールアドレスを入力してください"),
      ).toBeInTheDocument();
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    test("UT-F-003: メールアドレスの形式が不正な場合エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput =
        screen.getByPlaceholderText("メールアドレスを入力してください");
      await user.type(emailInput, "test@");
      await user.type(
        screen.getByPlaceholderText("パスワードを入力してください"),
        "password123",
      );

      await user.click(screen.getByRole("button", { name: "ログイン" }));

      expect(
        await screen.findByText("正しいメールアドレスの形式で入力してください"),
      ).toBeInTheDocument();
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    test("UT-F-004: パスワード未入力の場合エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(
        screen.getByPlaceholderText("メールアドレスを入力してください"),
        "test@example.com",
      );
      await user.click(screen.getByRole("button", { name: "ログイン" }));

      expect(
        await screen.findByText("パスワードを入力してください"),
      ).toBeInTheDocument();
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    test("UT-F-005: パスワードが8文字未満の場合エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(
        screen.getByPlaceholderText("メールアドレスを入力してください"),
        "test@example.com",
      );
      await user.type(
        screen.getByPlaceholderText("パスワードを入力してください"),
        "1234567",
      );
      await user.click(screen.getByRole("button", { name: "ログイン" }));

      expect(
        await screen.findByText("8文字以上で入力してください"),
      ).toBeInTheDocument();
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });
  });

  describe("APIエラー", () => {
    test("UT-F-007: 認証失敗（Supabaseが401相当を返す）の場合エラーメッセージが表示される", async () => {
      const user = userEvent.setup();

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        error: { message: "Invalid login credentials" },
      });

      render(<LoginPage />);

      await user.type(
        screen.getByPlaceholderText("メールアドレスを入力してください"),
        "test@example.com",
      );
      await user.type(
        screen.getByPlaceholderText("パスワードを入力してください"),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: "ログイン" }));

      expect(
        await screen.findByText(
          "メールアドレスまたはパスワードが正しくありません",
        ),
      ).toBeInTheDocument();
      // 認証失敗時はJIT同期APIを呼ばない
      expect(apiFetch).not.toHaveBeenCalled();
    });

    test("UT-F-008: JIT同期API失敗（ApiError）の場合そのメッセージが表示される", async () => {
      const user = userEvent.setup();

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        error: null,
      });
      (apiFetch as jest.Mock).mockRejectedValue(
        new ApiError("SYNC_FAILED", "プロフィールの同期に失敗しました", 500),
      );

      render(<LoginPage />);

      await user.type(
        screen.getByPlaceholderText("メールアドレスを入力してください"),
        "test@example.com",
      );
      await user.type(
        screen.getByPlaceholderText("パスワードを入力してください"),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: "ログイン" }));

      expect(
        await screen.findByText("プロフィールの同期に失敗しました"),
      ).toBeInTheDocument();
      // 失敗しているので画面遷移はしない
      expect(mockPush).not.toHaveBeenCalled();
    });

    test("UT-F-009: JIT同期API失敗（予期せぬエラー）の場合フォールバックメッセージが表示される", async () => {
      const user = userEvent.setup();

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        error: null,
      });
      (apiFetch as jest.Mock).mockRejectedValue(new Error("network error"));

      render(<LoginPage />);

      await user.type(
        screen.getByPlaceholderText("メールアドレスを入力してください"),
        "test@example.com",
      );
      await user.type(
        screen.getByPlaceholderText("パスワードを入力してください"),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: "ログイン" }));

      expect(
        await screen.findByText(
          "通信エラーが発生しました。時間をおいて再度お試しください。",
        ),
      ).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("UI操作", () => {
    test("UT-F-010: パスワード表示切替アイコンをクリックするとinput typeが切り替わる", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput =
        screen.getByPlaceholderText("パスワードを入力してください");
      expect(passwordInput).toHaveAttribute("type", "password");

      await user.click(screen.getByLabelText("パスワードを表示する"));
      expect(passwordInput).toHaveAttribute("type", "text");

      await user.click(screen.getByLabelText("パスワードを隠す"));
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    test("UT-F-011: 送信中はボタンがdisabledになりLoadingSpinnerが表示される", async () => {
      const user = userEvent.setup();

      let resolveSignIn: (value: { error: null }) => void;
      (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSignIn = resolve;
          }),
      );

      render(<LoginPage />);

      await user.type(
        screen.getByPlaceholderText("メールアドレスを入力してください"),
        "test@example.com",
      );
      await user.type(
        screen.getByPlaceholderText("パスワードを入力してください"),
        "password123",
      );

      // クリック前に、送信ボタンを名前付きで取得しておく（テキストが変わる前に掴む）
      const submitButton = screen.getByRole("button", { name: "ログイン" });
      await user.click(submitButton);

      // 同じ要素（submitButton）の状態を確認する
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      resolveSignIn!({ error: null });
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    test("UT-F-012: 「新規登録」リンクが /register を指している", () => {
      render(<LoginPage />);
      expect(screen.getByRole("link", { name: "新規登録" })).toHaveAttribute(
        "href",
        "/register",
      );
    });

    test("UT-F-013: 「招待URLをお持ちの方」リンクが /invitations/accept を指している", () => {
      render(<LoginPage />);
      expect(
        screen.getByRole("link", { name: /招待URLをお持ちの方/ }),
      ).toHaveAttribute("href", "/invitations/accept");
    });
  });

  describe("二重送信防止", () => {
    test("UT-F-014: ログインボタンを連続クリックしてもAPIは1回しか呼ばれない", async () => {
      const user = userEvent.setup();

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        error: null,
      });
      (apiFetch as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/admin/stats") {
          return Promise.reject(new ApiError("NOT_FOUND", "Not Found", 404));
        }
        return Promise.resolve({ data: {}, message: "success" });
      });

      render(<LoginPage />);

      await user.type(
        screen.getByPlaceholderText("メールアドレスを入力してください"),
        "test@example.com",
      );
      await user.type(
        screen.getByPlaceholderText("パスワードを入力してください"),
        "password123",
      );

      const loginButton = screen.getByRole("button", { name: "ログイン" });
      await Promise.all([user.click(loginButton), user.click(loginButton)]);

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(1);
      });

      const syncCalls = (apiFetch as jest.Mock).mock.calls.filter(
        ([url]) => url === "/api/auth/sync",
      );
      expect(syncCalls).toHaveLength(1);
    });
  });
});
