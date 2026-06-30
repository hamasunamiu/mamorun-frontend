import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "../page";

const mockSignOut = jest.fn();
const mockGetSession = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signOut: () => mockSignOut(),
      getSession: () => mockGetSession(),
    },
  },
}));

jest.mock("@/components/settings/PetEditModal", () => ({
  PetEditModal: ({ open, mode }: { open: boolean; mode: string }) =>
    open ? <div data-testid={`pet-modal-${mode}`}>PetEditModal</div> : null,
}));

global.fetch = jest.fn();
const mockFetch = fetch as jest.Mock;

const mockSession = {
  data: {
    session: {
      user: { email: "test@example.com" },
      access_token: "mock-token",
    },
  },
};

describe("SettingsPage", () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    mockGetSession.mockResolvedValue(mockSession);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          is_premium: false,
          line_user_id: null,
          pet_id: null,
          notification_time: "morning",
        },
      }),
    });
  });

  describe("初期表示", () => {
    test("UT-F-701: メールアドレスが読み込み中...から始まる", () => {
      render(<SettingsPage />);
      expect(screen.getByText("読み込み中...")).toBeInTheDocument();
    });

    test("UT-F-702: 無料プランの場合「無料プラン」バッジが表示される", async () => {
      render(<SettingsPage />);
      expect(await screen.findByText("無料プラン")).toBeInTheDocument();
    });

    test("UT-F-703: プレミアムプランの場合「プレミアムプラン」バッジが表示される", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            is_premium: true,
            line_user_id: null,
            pet_id: null,
            notification_time: "morning",
          },
        }),
      });
      render(<SettingsPage />);
      expect(await screen.findByText("プレミアムプラン")).toBeInTheDocument();
    });
  });

  describe("プレミアム関連", () => {
    test("UT-F-704: 無料プランの時、アップグレードボタンが表示される", async () => {
      render(<SettingsPage />);
      await waitFor(() => {
        expect(
          screen.getByText("👑 プレミアムにアップグレード"),
        ).toBeInTheDocument();
      });
    });

    test("UT-F-705: プレミアムの時、アップグレードボタンが表示されない", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            is_premium: true,
            line_user_id: null,
            pet_id: null,
          },
        }),
      });
      render(<SettingsPage />);
      await waitFor(() => {
        expect(
          screen.queryByText("👑 プレミアムにアップグレード"),
        ).not.toBeInTheDocument();
      });
    });

    test("UT-F-706: アップグレードボタンクリック中は「処理中...」になり連打できない", async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { is_premium: false, line_user_id: null, pet_id: null },
          }),
        })
        .mockImplementationOnce(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve({
                    ok: true,
                    json: async () => ({ data: { url: null } }),
                  }),
                100,
              ),
            ),
        );

      render(<SettingsPage />);
      const upgradeButton =
        await screen.findByText("👑 プレミアムにアップグレード");
      await user.click(upgradeButton);
      expect(await screen.findByText("処理中...")).toBeInTheDocument();
      expect(screen.getByText("処理中...").closest("button")).toBeDisabled();
    });
  });

  describe("モーダル", () => {
    test("UT-F-707: ログアウトボタンクリックでモーダルが開く", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);
      await user.click(screen.getByRole("button", { name: "ログアウト" }));
      expect(screen.getByText("ログアウトしますか？")).toBeInTheDocument();
    });

    test("UT-F-708: ログアウトモーダルのキャンセルで閉じる", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);
      await user.click(screen.getByRole("button", { name: "ログアウト" }));
      await user.click(screen.getByRole("button", { name: "キャンセル" }));
      await waitFor(() => {
        expect(
          screen.queryByText("ログアウトしますか？"),
        ).not.toBeInTheDocument();
      });
    });

    test("UT-F-709: 家族を招待するクリックでモーダルが開く", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);
      await user.click(screen.getByText("招待URLを発行する"));
      expect(screen.getByText("家族を招待する")).toBeInTheDocument();
    });
  });

  describe("ペット情報", () => {
    test("UT-F-710: ペット情報を編集するボタンでモーダルが開く", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);
      await user.click(screen.getByText("ペット情報を編集する"));
      expect(screen.getByTestId("pet-modal-edit")).toBeInTheDocument();
    });

    test("UT-F-711: 新しいペットを追加するボタンでモーダルが開く", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);
      await user.click(screen.getByText("新しいペットを追加する"));
      expect(screen.getByTestId("pet-modal-add")).toBeInTheDocument();
    });
  });
});
