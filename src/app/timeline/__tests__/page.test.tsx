import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TimelinePage from "../page";
import { apiFetch } from "@/lib/api-client";

jest.mock("@/lib/api-client", () => {
  class ApiError extends Error {
    code;
    status;
    constructor(code, message, status) {
      super(message);
      this.code = code;
      this.status = status;
    }
  }
  return {
    apiFetch: jest.fn(),
    ApiError,
  };
});

const mockApiFetch = jest.mocked(apiFetch);

const mockLogs = [
  {
    id: "log-1",
    pet_id: "pet-1",
    created_by_id: "user-1",
    title: "朝の体調チェック",
    detail_memo: "元気です",
    attached_image_url: null,
    created_at: "2026-06-23T08:00:00.000Z",
  },
];

describe("TimelinePage", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  describe("初期表示", () => {
    test("UT-F-601: ログ取得中はローディング表示される", () => {
      mockApiFetch.mockReturnValue(new Promise(() => {}));
      render(<TimelinePage />);
      expect(screen.getByText("読み込み中...")).toBeInTheDocument();
    });

    test("UT-F-602: ログが0件の場合「まだ記録がありません」表示", async () => {
      mockApiFetch.mockImplementation((path: string) => {
        if (path === "/api/health-logs") {
          return Promise.resolve({ data: [], total: 0 });
        }
        return Promise.resolve({ data: { id: "user-1" } });
      });
      render(<TimelinePage />);
      expect(
        await screen.findByText("まだ記録がありません"),
      ).toBeInTheDocument();
    });

    test("UT-F-603: ログがある場合、一覧が表示される", async () => {
      mockApiFetch.mockImplementation((path: string) => {
        if (path === "/api/health-logs") {
          return Promise.resolve({ data: mockLogs, total: 1 });
        }
        return Promise.resolve({ data: { id: "user-1" } });
      });
      render(<TimelinePage />);
      expect(await screen.findByText("朝の体調チェック")).toBeInTheDocument();
    });
  });

  describe("投稿フォーム", () => {
    beforeEach(() => {
      mockApiFetch.mockImplementation((path: string) => {
        if (path === "/api/health-logs") {
          return Promise.resolve({ data: [], total: 0 });
        }
        return Promise.resolve({ data: { id: "user-1" } });
      });
    });

    test("UT-F-604: タイトルが空の場合、投稿ボタンがdisabled", async () => {
      render(<TimelinePage />);
      await waitFor(() => {
        expect(screen.queryByText("読み込み中...")).not.toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: "投稿する" })).toBeDisabled();
    });

    test("UT-F-605: タイトルを入力すると投稿ボタンが有効になる", async () => {
      const user = userEvent.setup();
      render(<TimelinePage />);
      await waitFor(() => {
        expect(screen.queryByText("読み込み中...")).not.toBeInTheDocument();
      });

      await user.type(
        screen.getByPlaceholderText("例：朝の体調チェック"),
        "夜の様子",
      );

      expect(
        screen.getByRole("button", { name: "投稿する" }),
      ).not.toBeDisabled();
    });

    test("UT-F-606: 投稿成功で新しいログが追加され、フォームがクリアされる", async () => {
      const user = userEvent.setup();
      mockApiFetch.mockImplementation((path: string, options?: RequestInit) => {
        if (path === "/api/health-logs" && options?.method === "POST") {
          return Promise.resolve({
            id: "log-2",
            pet_id: "pet-1",
            created_by_id: "user-1",
            title: "夜の様子",
            detail_memo: "",
            attached_image_url: null,
            created_at: "2026-06-23T20:00:00.000Z",
          });
        }
        if (path === "/api/health-logs") {
          return Promise.resolve({ data: [], total: 0 });
        }
        return Promise.resolve({ data: { id: "user-1" } });
      });

      render(<TimelinePage />);
      await waitFor(() => {
        expect(screen.queryByText("読み込み中...")).not.toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText("例：朝の体調チェック");
      await user.type(titleInput, "夜の様子");
      await user.click(screen.getByRole("button", { name: "投稿する" }));

      expect(await screen.findByText("夜の様子")).toBeInTheDocument();
      expect(titleInput).toHaveValue("");
    });
  });

  describe("削除機能", () => {
    test("UT-F-607: 自分の投稿には削除ボタンが表示される", async () => {
      mockApiFetch.mockImplementation((path: string) => {
        if (path === "/api/health-logs") {
          return Promise.resolve({ data: mockLogs, total: 1 });
        }
        return Promise.resolve({ data: { id: "user-1" } });
      });
      render(<TimelinePage />);
      expect(await screen.findByText("🗑 削除")).toBeInTheDocument();
    });

    test("UT-F-608: 他人の投稿には削除ボタンが表示されない", async () => {
      mockApiFetch.mockImplementation((path: string) => {
        if (path === "/api/health-logs") {
          return Promise.resolve({ data: mockLogs, total: 1 });
        }
        return Promise.resolve({ data: { id: "other-user" } });
      });
      render(<TimelinePage />);
      await screen.findByText("朝の体調チェック");
      expect(screen.queryByText("🗑 削除")).not.toBeInTheDocument();
    });

    test("UT-F-609: 削除ボタンクリックで確認モーダルが開く", async () => {
      const user = userEvent.setup();
      mockApiFetch.mockImplementation((path: string) => {
        if (path === "/api/health-logs") {
          return Promise.resolve({ data: mockLogs, total: 1 });
        }
        return Promise.resolve({ data: { id: "user-1" } });
      });
      render(<TimelinePage />);

      await user.click(await screen.findByText("🗑 削除"));

      expect(screen.getByText("ログを削除しますか？")).toBeInTheDocument();
    });

    test("UT-F-610: 削除確認でログが一覧から消える", async () => {
      const user = userEvent.setup();
      mockApiFetch.mockImplementation((path: string, options?: RequestInit) => {
        if (path === "/api/health-logs/log-1" && options?.method === "DELETE") {
          return Promise.resolve({});
        }
        if (path === "/api/health-logs") {
          return Promise.resolve({ data: mockLogs, total: 1 });
        }
        return Promise.resolve({ data: { id: "user-1" } });
      });
      render(<TimelinePage />);

      await user.click(await screen.findByText("🗑 削除"));
      await user.click(screen.getByRole("button", { name: "削除する" }));

      await waitFor(() => {
        expect(screen.queryByText("朝の体調チェック")).not.toBeInTheDocument();
      });
    });
  });
});
