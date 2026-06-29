import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "../page";
import { supabase } from "@/lib/supabase";
import { apiFetch, ApiError } from "@/lib/api-client";

// useRouter・useSearchParamsをモック化
const mockPush = jest.fn();
// useSearchParamsの返り値（getメソッド）をテストごとに切り替えられるようにする
const mockGet = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// supabaseをモック化
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
    },
  },
}));

// apiFetchをモック化
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

// アカウント情報（ニックネーム・メール・パスワード）を入力する共通処理
async function fillAccountInfo(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("例：花子"), "花子");
  await user.type(
    screen.getByPlaceholderText("example@email.com"),
    "hanako@example.com",
  );
  await user.type(screen.getByPlaceholderText("8文字以上"), "password123");
}

// 1匹目のペット情報を入力する共通処理
async function fillFirstPet(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getAllByText("犬")[0]);
  await user.type(screen.getByPlaceholderText("例：むぎ"), "むぎ");
  await user.click(screen.getAllByText("おとこのこ")[0]);
  await user.type(screen.getByLabelText(/生年月日/), "2023-01-01");
}

describe("RegisterPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでは「通常登録」（招待トークンなし）の状態にする
    mockGet.mockReturnValue(null);
  });

  describe("正常系", () => {
    test("UT-F-101: 正しい情報で登録（ペット1匹）すると /home へ遷移する", async () => {
      const user = userEvent.setup();

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: null });
      (apiFetch as jest.Mock).mockResolvedValue({
        data: {},
        message: "success",
      });

      render(<RegisterPage />);
      await fillAccountInfo(user);
      await fillFirstPet(user);

      await user.click(screen.getByRole("button", { name: "登録する" }));

      await waitFor(() => {
        expect(supabase.auth.signUp).toHaveBeenCalledWith({
          email: "hanako@example.com",
          password: "password123",
        });
      });

      expect(apiFetch).toHaveBeenCalledWith("/api/auth/sync", {
        method: "POST",
      });
      expect(apiFetch).toHaveBeenCalledWith("/api/pets", {
        method: "POST",
        body: JSON.stringify({
          species: "dog",
          name: "むぎ",
          gender: "male",
          birthday: "2023-01-01",
          illness: "",
        }),
      });
      expect(mockPush).toHaveBeenCalledWith("/home");
    });

    test("UT-F-102: ペットを2匹以上登録すると、ペットの数だけ POST /api/pets が呼ばれる", async () => {
      const user = userEvent.setup();

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: null });
      (apiFetch as jest.Mock).mockResolvedValue({
        data: {},
        message: "success",
      });

      render(<RegisterPage />);
      await fillAccountInfo(user);
      await fillFirstPet(user);

      // 「＋ペットを追加する」をクリックして2匹目のフォームを表示
      await user.click(screen.getByText("＋ペットを追加する"));

      // 2匹目
      await user.click(screen.getAllByText("猫")[1]);
      await user.type(screen.getAllByPlaceholderText("例：むぎ")[1], "たま");
      await user.click(screen.getAllByText("おんなのこ")[1]);
      await user.type(screen.getAllByLabelText(/生年月日/)[1], "2022-06-15");

      await user.click(screen.getByRole("button", { name: "登録する" }));

      await waitFor(() => {
        expect(apiFetch).toHaveBeenCalledWith("/api/pets", {
          method: "POST",
          body: JSON.stringify({
            species: "dog",
            name: "むぎ",
            gender: "male",
            birthday: "2023-01-01",
            illness: "",
          }),
        });
      });

      expect(apiFetch).toHaveBeenCalledWith("/api/pets", {
        method: "POST",
        body: JSON.stringify({
          species: "cat",
          name: "たま",
          gender: "female",
          birthday: "2022-06-15",
          illness: "",
        }),
      });

      expect(apiFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("招待経由登録", () => {
    test("UT-F-103: 招待URL経由で登録すると、ペット情報フォームが非表示になり招待受諾APIが呼ばれる", async () => {
      const user = userEvent.setup();

      // このテストだけ「招待トークンあり」の状態にする
      mockGet.mockReturnValue("invite-token-abc123");

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: null });
      (apiFetch as jest.Mock).mockResolvedValue({
        data: {},
        message: "success",
      });

      render(<RegisterPage />);

      // ペット情報フォームが表示されていないことを確認
      expect(screen.queryByPlaceholderText("例：むぎ")).not.toBeInTheDocument();

      await fillAccountInfo(user);
      await user.click(screen.getByRole("button", { name: "登録する" }));

      await waitFor(() => {
        expect(supabase.auth.signUp).toHaveBeenCalledWith({
          email: "hanako@example.com",
          password: "password123",
        });
      });

      expect(apiFetch).toHaveBeenCalledWith("/api/auth/sync", {
        method: "POST",
      });
      // ペット登録APIは呼ばれない
      expect(apiFetch).not.toHaveBeenCalledWith("/api/pets", expect.anything());
      // 招待受諾APIが呼ばれる
      expect(apiFetch).toHaveBeenCalledWith(
        "/api/invitations/invite-token-abc123/accept",
        {
          method: "POST",
        },
      );

      expect(mockPush).toHaveBeenCalledWith("/home");
    });
  });

  describe("バリデーション", () => {
    test("UT-F-104: ニックネーム未入力の場合エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(
        screen.getByPlaceholderText("example@email.com"),
        "hanako@example.com",
      );
      await user.type(screen.getByPlaceholderText("8文字以上"), "password123");
      await fillFirstPet(user);
      await user.click(screen.getByRole("button", { name: "登録する" }));

      expect(
        await screen.findByText("お名前を入力してください"),
      ).toBeInTheDocument();
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    test("UT-F-105: メールアドレス未入力の場合エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByPlaceholderText("例：花子"), "花子");
      await user.type(screen.getByPlaceholderText("8文字以上"), "password123");
      await fillFirstPet(user);
      await user.click(screen.getByRole("button", { name: "登録する" }));

      expect(
        await screen.findByText("メールアドレスを入力してください"),
      ).toBeInTheDocument();
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    test("UT-F-106: メールアドレスの形式が不正な場合エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByPlaceholderText("例：花子"), "花子");
      await user.type(
        screen.getByPlaceholderText("example@email.com"),
        "test@",
      );
      await user.type(screen.getByPlaceholderText("8文字以上"), "password123");
      await fillFirstPet(user);
      await user.click(screen.getByRole("button", { name: "登録する" }));

      expect(
        await screen.findByText("正しいメールアドレスの形式で入力してください"),
      ).toBeInTheDocument();
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    test("UT-F-107: パスワード未入力の場合エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByPlaceholderText("例：花子"), "花子");
      await user.type(
        screen.getByPlaceholderText("example@email.com"),
        "hanako@example.com",
      );
      await fillFirstPet(user);
      await user.click(screen.getByRole("button", { name: "登録する" }));

      expect(
        await screen.findByText("パスワードを入力してください"),
      ).toBeInTheDocument();
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    test("UT-F-108: パスワードが8文字未満の場合エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByPlaceholderText("例：花子"), "花子");
      await user.type(
        screen.getByPlaceholderText("example@email.com"),
        "hanako@example.com",
      );
      await user.type(screen.getByPlaceholderText("8文字以上"), "1234567");
      await fillFirstPet(user);
      await user.click(screen.getByRole("button", { name: "登録する" }));

      expect(
        await screen.findByText("8文字以上で入力してください"),
      ).toBeInTheDocument();
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    test("UT-F-109: 種類未選択（ペット）の場合エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await fillAccountInfo(user);
      // 種類は選択せず、名前・性別・生年月日だけ入力
      await user.type(screen.getByPlaceholderText("例：むぎ"), "むぎ");
      await user.click(screen.getAllByText("おとこのこ")[0]);
      await user.type(screen.getByLabelText(/生年月日/), "2023-01-01");
      await user.click(screen.getByRole("button", { name: "登録する" }));

      expect(
        await screen.findByText("犬または猫を選択してください"),
      ).toBeInTheDocument();
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    test("UT-F-110: ペットの名前未入力の場合エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await fillAccountInfo(user);
      await user.click(screen.getAllByText("犬")[0]);
      await user.click(screen.getAllByText("おとこのこ")[0]);
      await user.type(screen.getByLabelText(/生年月日/), "2023-01-01");
      await user.click(screen.getByRole("button", { name: "登録する" }));

      expect(
        await screen.findByText("名前を入力してください"),
      ).toBeInTheDocument();
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    test("UT-F-111: 性別未選択（ペット）の場合エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await fillAccountInfo(user);
      await user.click(screen.getAllByText("犬")[0]);
      await user.type(screen.getByPlaceholderText("例：むぎ"), "むぎ");
      await user.type(screen.getByLabelText(/生年月日/), "2023-01-01");
      await user.click(screen.getByRole("button", { name: "登録する" }));

      expect(
        await screen.findByText("性別を選択してください"),
      ).toBeInTheDocument();
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    test("UT-F-112: 生年月日が未来の日付（ペット）の場合エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await fillAccountInfo(user);
      await user.click(screen.getAllByText("犬")[0]);
      await user.type(screen.getByPlaceholderText("例：むぎ"), "むぎ");
      await user.click(screen.getAllByText("おとこのこ")[0]);
      await user.type(screen.getByLabelText(/生年月日/), "2099-01-01");
      await user.click(screen.getByRole("button", { name: "登録する" }));

      expect(
        await screen.findByText("生年月日に未来の日付は設定できません"),
      ).toBeInTheDocument();
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    test("UT-F-113: 持病が1000文字を超える場合エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await fillAccountInfo(user);
      await fillFirstPet(user);
      // 1001文字の文字列を入力
      const longText = "あ".repeat(1001);
      await user.type(screen.getByLabelText("持病・特記事項"), longText);
      await user.click(screen.getByRole("button", { name: "登録する" }));

      expect(
        await screen.findByText("1000文字以内で入力してください"),
      ).toBeInTheDocument();
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    }, 10000); // 1001文字のタイピングは時間がかかるため、タイムアウトを10秒に延長
  });

  describe("APIエラー", () => {
    test("UT-F-114: メールアドレス重複（signUpError）の場合エラーメッセージとログイン誘導リンクが表示される", async () => {
      const user = userEvent.setup();

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        error: { message: "User already registered" },
      });

      render(<RegisterPage />);
      await fillAccountInfo(user);
      await fillFirstPet(user);
      await user.click(screen.getByRole("button", { name: "登録する" }));

      expect(
        await screen.findByText(/このメールアドレスはすでに登録されています/),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "ログイン画面へ" }),
      ).toBeInTheDocument();
      // signUpError時はJIT同期APIを呼ばない
      expect(apiFetch).not.toHaveBeenCalled();
    });

    test("UT-F-115: JIT同期API失敗の場合エラーメッセージが表示され、ログイン誘導リンクは表示されない", async () => {
      const user = userEvent.setup();

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: null });
      (apiFetch as jest.Mock).mockRejectedValue(
        new ApiError("SYNC_FAILED", "プロフィールの同期に失敗しました", 500),
      );

      render(<RegisterPage />);
      await fillAccountInfo(user);
      await fillFirstPet(user);
      await user.click(screen.getByRole("button", { name: "登録する" }));

      expect(
        await screen.findByText("プロフィールの同期に失敗しました"),
      ).toBeInTheDocument();
      // メール重複ではないので、ログイン誘導リンクは出ない
      expect(
        screen.queryByRole("link", { name: "ログイン画面へ" }),
      ).not.toBeInTheDocument();
    });

    test("UT-F-116: ペット登録API失敗の場合フォールバックメッセージが表示される", async () => {
      const user = userEvent.setup();

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: null });
      (apiFetch as jest.Mock)
        .mockResolvedValueOnce({ data: {}, message: "success" }) // ① JIT同期は成功
        .mockRejectedValueOnce(new Error("network error")); // ② ペット登録で失敗

      render(<RegisterPage />);
      await fillAccountInfo(user);
      await fillFirstPet(user);
      await user.click(screen.getByRole("button", { name: "登録する" }));

      expect(
        await screen.findByText(
          "ペット情報の登録に失敗しました。時間をおいて再度お試しください。",
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "ログイン画面へ" }),
      ).not.toBeInTheDocument();
    });

    test("UT-F-117: 招待トークンが無効の場合モーダルが表示される", async () => {
      const user = userEvent.setup();
      mockGet.mockReturnValue("invalid-token");

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: null });
      (apiFetch as jest.Mock)
        .mockResolvedValueOnce({ data: {}, message: "success" }) // JIT同期成功
        .mockRejectedValueOnce(
          new ApiError("INVALID_INVITE_TOKEN", "無効です", 400),
        );

      render(<RegisterPage />);
      await fillAccountInfo(user);
      await user.click(screen.getByRole("button", { name: "登録する" }));

      expect(
        await screen.findByText("招待リンクが無効です"),
      ).toBeInTheDocument();
      expect(screen.getByText("無効な招待URLです。")).toBeInTheDocument();
    });

    test("UT-F-118: 招待トークンの有効期限切れの場合モーダルが表示される", async () => {
      const user = userEvent.setup();
      mockGet.mockReturnValue("expired-token");

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: null });
      (apiFetch as jest.Mock)
        .mockResolvedValueOnce({ data: {}, message: "success" })
        .mockRejectedValueOnce(
          new ApiError("INVITE_TOKEN_GONE", "期限切れです", 410),
        );

      render(<RegisterPage />);
      await fillAccountInfo(user);
      await user.click(screen.getByRole("button", { name: "登録する" }));

      expect(
        await screen.findByText("招待リンクの有効期限が切れています"),
      ).toBeInTheDocument();
    });

    test("UT-F-119: すでに参加済みの場合モーダルが表示される", async () => {
      const user = userEvent.setup();
      mockGet.mockReturnValue("already-paired-token");

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: null });
      (apiFetch as jest.Mock)
        .mockResolvedValueOnce({ data: {}, message: "success" })
        .mockRejectedValueOnce(
          new ApiError("ALREADY_PAIRED", "既に参加済み", 409),
        );

      render(<RegisterPage />);
      await fillAccountInfo(user);
      await user.click(screen.getByRole("button", { name: "登録する" }));

      expect(await screen.findByText("すでに参加済みです")).toBeInTheDocument();
    });

    test("UT-F-120: 家族人数の上限到達の場合モーダルが表示される", async () => {
      const user = userEvent.setup();
      mockGet.mockReturnValue("family-full-token");

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: null });
      (apiFetch as jest.Mock)
        .mockResolvedValueOnce({ data: {}, message: "success" })
        .mockRejectedValueOnce(
          new ApiError("FAMILY_LIMIT_REACHED", "上限です", 409),
        );

      render(<RegisterPage />);
      await fillAccountInfo(user);
      await user.click(screen.getByRole("button", { name: "登録する" }));

      expect(
        await screen.findByText("招待を受け付けられません"),
      ).toBeInTheDocument();
    });

    test("UT-F-121: 未定義のエラーコードの場合フォールバックメッセージが表示される", async () => {
      const user = userEvent.setup();
      mockGet.mockReturnValue("some-token");

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: null });
      (apiFetch as jest.Mock)
        .mockResolvedValueOnce({ data: {}, message: "success" })
        .mockRejectedValueOnce(
          new ApiError("SOME_UNKNOWN_CODE", "未知のエラー", 500),
        );

      render(<RegisterPage />);
      await fillAccountInfo(user);
      await user.click(screen.getByRole("button", { name: "登録する" }));

      expect(
        await screen.findByText("エラーが発生しました"),
      ).toBeInTheDocument();
    });
  });

  describe("UI操作", () => {
    test("UT-F-122: 「＋ペットを追加する」をクリックするとペット情報フォームが1セクション追加される", async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      // 最初は1匹目だけ
      expect(screen.getAllByPlaceholderText("例：むぎ")).toHaveLength(1);

      await user.click(screen.getByText("＋ペットを追加する"));

      expect(screen.getAllByPlaceholderText("例：むぎ")).toHaveLength(2);
    });

    test("UT-F-123: ペットを削除すると（2匹以上の場合のみ）該当セクションが削除される", async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      // 1匹だけの状態では削除ボタンが表示されない
      expect(
        screen.queryByLabelText("このペットを削除"),
      ).not.toBeInTheDocument();

      // 2匹目を追加すると、削除ボタンが表示される（fields.length > 1）
      await user.click(screen.getByText("＋ペットを追加する"));
      expect(screen.getAllByLabelText("このペットを削除")).toHaveLength(2);

      // 1つ削除すると1匹分のフォームに戻る
      await user.click(screen.getAllByLabelText("このペットを削除")[0]);
      expect(screen.getAllByPlaceholderText("例：むぎ")).toHaveLength(1);
      // 1匹に戻ったら削除ボタンは再び非表示になる
      expect(
        screen.queryByLabelText("このペットを削除"),
      ).not.toBeInTheDocument();
    });
  });

  describe("モーダル", () => {
    test("UT-F-124: 招待エラーモーダルを背景クリック・Escキーで閉じても /login へ遷移する", async () => {
      const user = userEvent.setup();
      mockGet.mockReturnValue("invalid-token");

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: null });
      (apiFetch as jest.Mock)
        .mockResolvedValueOnce({ data: {}, message: "success" })
        .mockRejectedValueOnce(
          new ApiError("INVALID_INVITE_TOKEN", "無効です", 400),
        );

      render(<RegisterPage />);
      await fillAccountInfo(user);
      await user.click(screen.getByRole("button", { name: "登録する" }));

      await screen.findByText("招待リンクが無効です");

      // Escキーで閉じる
      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });
  });

  describe("二重送信防止", () => {
    test("UT-F-126: 登録ボタンを連続クリックしてもAPIは1回しか呼ばれない", async () => {
      const user = userEvent.setup();

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: null });
      (apiFetch as jest.Mock).mockResolvedValue({
        data: {},
        message: "success",
      });

      render(<RegisterPage />);
      await fillAccountInfo(user);
      await fillFirstPet(user);

      const submitButton = screen.getByRole("button", { name: "登録する" });
      await Promise.all([user.click(submitButton), user.click(submitButton)]);

      await waitFor(() => {
        expect(supabase.auth.signUp).toHaveBeenCalledTimes(1);
      });
      // JIT同期1回＋ペット登録1回＝2回（2回連続クリックでも増えない）
      expect(apiFetch).toHaveBeenCalledTimes(2);
    });
  });
});
