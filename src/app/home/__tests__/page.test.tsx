import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CareHomePage from "../page";
import { useCareHomeData } from "../_components/useCareHomeData";
import { apiFetch } from "@/lib/api-client";
import type { Pet, Todo, Schedule, Profile } from "@/types";

// useCareHomeDataを丸ごとモック化する
// Realtime同期自体の検証はこのテストの対象外とし、
// 「フックが返すデータをどう表示・操作するか」のみをテストする
jest.mock("../_components/useCareHomeData", () => ({
  useCareHomeData: jest.fn(),
}));

// apiFetchをモック化（jsdomにfetchが未実装のため）
jest.mock("@/lib/api-client", () => ({
  apiFetch: jest.fn(),
}));

// localStorageをモック化（jsdomでは動作しない）
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// --- テスト用のサンプルデータ ---

const mockProfile: Profile = {
  id: "profile-1",
  line_user_id: null,
  is_premium: false,
  stripe_customer_id: null,
  pet_id: "pet-1",
  notification_time: "morning",
  display_name: "まの",
  created_at: "2026-01-01T00:00:00.000Z",
};

const mockPet: Pet = {
  id: "pet-1",
  name: "むぎ",
  species: "dog",
  gender: "male",
  birthday: "2023-01-01",
  illness: null,
  hospital_name: "〇〇動物病院",
  hospital_phone: "0312345678",
  hospital_address: "東京都渋谷区...",
  hospital_card_image_url: null,
  insurance_card_image_url: null,
  created_at: "2026-01-01T00:00:00.000Z",
};

const mockTodo: Todo = {
  id: "todo-1",
  pet_id: "pet-1",
  task_name: "朝ごはん",
  is_completed: false,
  completed_by_id: null,
  completed_by: null,
  completed_at: null,
  todo_date: "2026-06-29",
  created_at: "2026-06-29T00:00:00.000Z",
};

const mockSchedule: Schedule = {
  id: "schedule-1",
  pet_id: "pet-1",
  title: "ワクチン接種",
  scheduled_content: "狂犬病ワクチン",
  scheduled_date: "2026-07-15",
  is_completed: false,
  created_at: "2026-06-29T00:00:00.000Z",
};

type MockCareHomeData = ReturnType<typeof useCareHomeData>;

function createMockHookReturn(
  overrides: Partial<MockCareHomeData> = {},
): MockCareHomeData {
  return {
    profile: mockProfile,
    pet: mockPet,
    setPet: jest.fn(),
    todos: [mockTodo],
    setTodos: jest.fn(),
    schedules: [mockSchedule],
    setSchedules: jest.fn(),
    petList: [mockPet],
    isLoading: false,
    loadError: null,
    isMounted: true,
    ...overrides,
  };
}

describe("CareHomePage", () => {
  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: true });
    jest.setSystemTime(new Date("2026-06-30T09:00:00+09:00"));

    jest.clearAllMocks();
    window.localStorage.clear();

    (useCareHomeData as jest.Mock).mockReturnValue(createMockHookReturn());

    (apiFetch as jest.Mock).mockResolvedValue({});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("状態表示", () => {
    test("UT-F-201: isLoading=trueの場合LoadingSpinnerが表示される", () => {
      (useCareHomeData as jest.Mock).mockReturnValue(
        createMockHookReturn({ isLoading: true }),
      );

      render(<CareHomePage />);

      // LoadingSpinnerコンポーネントには見た目上のテキストがないため、
      // role="status"（読み込み中を示す共通のARIAロール）で存在を確認する
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    test("UT-F-202: loadErrorが存在する場合ErrorMessageが表示される", () => {
      (useCareHomeData as jest.Mock).mockReturnValue(
        createMockHookReturn({
          loadError:
            "データの取得に失敗しました。時間をおいて再度お試しください。",
        }),
      );

      render(<CareHomePage />);

      expect(
        screen.getByText(
          "データの取得に失敗しました。時間をおいて再度お試しください。",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("ToDo関連", () => {
    test("UT-F-203: ToDo「追加」ボタンクリックでModalが開く", async () => {
      const user = userEvent.setup();
      render(<CareHomePage />);

      await user.click(screen.getByRole("button", { name: "お世話を追加" }));

      expect(await screen.findByText("ToDoを追加する")).toBeInTheDocument();
      expect(screen.getByLabelText(/タスク名/)).toHaveValue("");
    });

    test("UT-F-204: ToDoタスク名未入力で送信するとエラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      render(<CareHomePage />);

      await user.click(screen.getByRole("button", { name: "お世話を追加" }));
      await user.click(screen.getByRole("button", { name: "追加する" }));

      expect(
        await screen.findByText("タスク名を入力してください"),
      ).toBeInTheDocument();
    });

    test("UT-F-205: ToDoタスク名が250文字を超える場合エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      render(<CareHomePage />);

      await user.click(screen.getByRole("button", { name: "お世話を追加" }));
      await user.type(screen.getByLabelText(/タスク名/), "あ".repeat(251));
      await user.click(screen.getByRole("button", { name: "追加する" }));

      expect(
        await screen.findByText("250文字以内で入力してください"),
      ).toBeInTheDocument();
    }, 10000);

    test("UT-F-206: 正しいタスク名で新規追加するとtodosに追加されModalが閉じる", async () => {
      const user = userEvent.setup();
      render(<CareHomePage />);

      await user.click(screen.getByRole("button", { name: "お世話を追加" }));
      await user.type(screen.getByLabelText(/タスク名/), "お昼ごはん");
      await user.click(screen.getByRole("button", { name: "追加する" }));

      expect(apiFetch).toHaveBeenCalledWith("/api/todos", {
        method: "POST",
        body: JSON.stringify({ task_name: "お昼ごはん" }),
      });

      await waitFor(() => {
        expect(screen.queryByText("ToDoを追加する")).not.toBeInTheDocument();
      });
    });

    test("UT-F-207: ToDo編集ボタンクリックでModalが開き既存のタスク名が入る", async () => {
      const user = userEvent.setup();
      render(<CareHomePage />);

      await user.click(
        screen.getByRole("button", { name: "朝ごはんのメニューを開く" }),
      );
      await user.click(screen.getByRole("menuitem", { name: "編集" }));

      expect(await screen.findByText("ToDoを編集する")).toBeInTheDocument();
      expect(screen.getByLabelText(/タスク名/)).toHaveValue("朝ごはん");
    });

    test("UT-F-208: タスク名変更して送信すると該当Todoが更新される", async () => {
      const user = userEvent.setup();
      render(<CareHomePage />);

      await user.click(
        screen.getByRole("button", { name: "朝ごはんのメニューを開く" }),
      );
      await user.click(screen.getByRole("menuitem", { name: "編集" }));

      const input = await screen.findByLabelText(/タスク名/);
      await user.clear(input);
      await user.type(input, "夜ごはん");
      await user.click(screen.getByRole("button", { name: "更新する" }));

      expect(apiFetch).toHaveBeenCalledWith("/api/todos/todo-1", {
        method: "PATCH",
        body: JSON.stringify({ task_name: "夜ごはん" }),
      });
    });

    test("UT-F-209: ToDo完了切り替え：未完了→完了", async () => {
      const user = userEvent.setup();
      render(<CareHomePage />);

      await user.click(
        screen.getByRole("checkbox", { name: "朝ごはんを完了にする" }),
      );

      expect(apiFetch).toHaveBeenCalledWith("/api/todos/todo-1", {
        method: "PATCH",
        body: JSON.stringify({ is_completed: true }),
      });
    });

    test("UT-F-210: ToDo完了切り替え：完了→未完了", async () => {
      const user = userEvent.setup();
      const completedTodo = {
        ...mockTodo,
        is_completed: true,
        completed_by_id: "profile-1",
      };
      (useCareHomeData as jest.Mock).mockReturnValue(
        createMockHookReturn({ todos: [completedTodo] }),
      );

      render(<CareHomePage />);

      await user.click(screen.getByRole("checkbox", { checked: true }));

      expect(apiFetch).toHaveBeenCalledWith("/api/todos/todo-1", {
        method: "PATCH",
        body: JSON.stringify({ is_completed: false }),
      });
    });

    test("UT-F-211: ToDo削除リクエストで確認Modalが開く", async () => {
      const user = userEvent.setup();
      render(<CareHomePage />);

      await user.click(
        screen.getByRole("button", { name: "朝ごはんのメニューを開く" }),
      );
      await user.click(screen.getByRole("menuitem", { name: "削除" }));

      // 削除確認モーダルの内部構造は未確認のため、対象名（朝ごはん）が表示されることで判断
      expect(
        await screen.findByText(
          "「朝ごはん」を削除します。この操作は取り消せません。",
        ),
      ).toBeInTheDocument();
    });

    test("UT-F-212: ToDo削除確認すると該当Todoがtodosから除外される", async () => {
      const user = userEvent.setup();
      render(<CareHomePage />);

      await user.click(
        screen.getByRole("button", { name: "朝ごはんのメニューを開く" }),
      );
      await user.click(screen.getByRole("menuitem", { name: "削除" }));
      await user.click(screen.getByRole("button", { name: /削除/ }));

      expect(apiFetch).toHaveBeenCalledWith("/api/todos/todo-1", {
        method: "DELETE",
      });
    });

    describe("予定関連", () => {
      test("UT-F-213: 予定「追加」ボタンクリックでModalが開く", async () => {
        const user = userEvent.setup();
        render(<CareHomePage />);

        await user.click(screen.getByRole("button", { name: "予定を追加" }));

        expect(await screen.findByText("予定を追加する")).toBeInTheDocument();
        expect(screen.getByLabelText(/タイトル/)).toHaveValue("");
      });

      test("UT-F-214: 予定タイトル未入力で送信するとエラーメッセージが表示される", async () => {
        const user = userEvent.setup();
        render(<CareHomePage />);

        await user.click(screen.getByRole("button", { name: "予定を追加" }));
        await user.type(screen.getByLabelText(/予定日/), "2026-07-01");
        await user.click(screen.getByRole("button", { name: "追加する" }));

        expect(
          await screen.findByText("タイトルを入力してください"),
        ).toBeInTheDocument();
      });

      test("UT-F-215: 予定タイトルが255文字を超える場合エラーメッセージが表示される", async () => {
        const user = userEvent.setup();
        render(<CareHomePage />);

        await user.click(screen.getByRole("button", { name: "予定を追加" }));
        await user.type(screen.getByLabelText(/タイトル/), "あ".repeat(256));
        await user.type(screen.getByLabelText(/予定日/), "2026-07-01");
        await user.click(screen.getByRole("button", { name: "追加する" }));

        expect(
          await screen.findByText("255文字以内で入力してください"),
        ).toBeInTheDocument();
      }, 10000);

      test("UT-F-216: 予定内容が1000文字を超える場合エラーメッセージが表示される", async () => {
        const user = userEvent.setup();
        render(<CareHomePage />);

        await user.click(screen.getByRole("button", { name: "予定を追加" }));
        await user.type(screen.getByLabelText(/タイトル/), "フィラリア薬");

        // 1001文字の一括入力はuser.typeだと遅すぎるため、fireEvent.changeで直接設定する
        fireEvent.change(screen.getByLabelText("予定内容"), {
          target: { value: "あ".repeat(1001) },
        });

        await user.type(screen.getByLabelText(/予定日/), "2026-07-01");
        await user.click(screen.getByRole("button", { name: "追加する" }));

        expect(
          await screen.findByText("1000文字以内で入力してください"),
        ).toBeInTheDocument();
      });

      test("UT-F-217: 予定日未入力で送信するとエラーメッセージが表示される", async () => {
        const user = userEvent.setup();
        render(<CareHomePage />);

        await user.click(screen.getByRole("button", { name: "予定を追加" }));
        await user.type(screen.getByLabelText(/タイトル/), "フィラリア薬");
        await user.click(screen.getByRole("button", { name: "追加する" }));

        expect(
          await screen.findByText("予定日を入力してください"),
        ).toBeInTheDocument();
      });

      test("UT-F-218: 予定日が過去の日付の場合エラーメッセージが表示される", async () => {
        const user = userEvent.setup();
        render(<CareHomePage />);

        await user.click(screen.getByRole("button", { name: "予定を追加" }));
        await user.type(screen.getByLabelText(/タイトル/), "フィラリア薬");
        await user.type(screen.getByLabelText(/予定日/), "2020-01-01");
        await user.click(screen.getByRole("button", { name: "追加する" }));

        expect(
          await screen.findByText("予定日に過去の日付は設定できません"),
        ).toBeInTheDocument();
      });

      test("UT-F-219: 予定日が本日（境界値）の場合バリデーションを通過する", async () => {
        const user = userEvent.setup();
        render(<CareHomePage />);

        await user.click(screen.getByRole("button", { name: "予定を追加" }));
        await user.type(screen.getByLabelText(/タイトル/), "フィラリア薬");
        await user.type(screen.getByLabelText(/予定日/), "2026-06-30"); // 今日の日付に更新
        await user.click(screen.getByRole("button", { name: "追加する" }));

        expect(apiFetch).toHaveBeenCalledWith(
          "/api/schedules",
          expect.any(Object),
        );
      });

      test("UT-F-220: 正しい値で予定を新規追加するとschedulesに追加される", async () => {
        const user = userEvent.setup();
        render(<CareHomePage />);

        await user.click(screen.getByRole("button", { name: "予定を追加" }));
        await user.type(screen.getByLabelText(/タイトル/), "フィラリア薬");
        await user.type(screen.getByLabelText("予定内容"), "毎月15日に投与");
        await user.type(screen.getByLabelText(/予定日/), "2026-07-15");
        await user.click(screen.getByRole("button", { name: "追加する" }));

        expect(apiFetch).toHaveBeenCalledWith("/api/schedules", {
          method: "POST",
          body: JSON.stringify({
            title: "フィラリア薬",
            scheduled_content: "毎月15日に投与",
            scheduled_date: "2026-07-15",
          }),
        });
      });

      test("UT-F-221: 予定編集ボタンクリックでModalが開き既存値が入る", async () => {
        const user = userEvent.setup();
        render(<CareHomePage />);

        await user.click(
          screen.getByRole("button", { name: "ワクチン接種のメニューを開く" }),
        );
        await user.click(screen.getByRole("menuitem", { name: "編集" }));

        expect(await screen.findByText("予定を編集する")).toBeInTheDocument();
        expect(screen.getByLabelText(/タイトル/)).toHaveValue("ワクチン接種");
        expect(screen.getByLabelText("予定内容")).toHaveValue("狂犬病ワクチン");
        expect(screen.getByLabelText(/予定日/)).toHaveValue("2026-07-15");
      });

      test("UT-F-222: 編集して送信すると該当のScheduleが更新される", async () => {
        const user = userEvent.setup();
        render(<CareHomePage />);

        await user.click(
          screen.getByRole("button", { name: "ワクチン接種のメニューを開く" }),
        );
        await user.click(screen.getByRole("menuitem", { name: "編集" }));

        const titleInput = await screen.findByLabelText(/タイトル/);
        await user.clear(titleInput);
        await user.type(titleInput, "混合ワクチン");
        await user.click(screen.getByRole("button", { name: "更新する" }));

        expect(apiFetch).toHaveBeenCalledWith("/api/schedules/schedule-1", {
          method: "PATCH",
          body: JSON.stringify({
            title: "混合ワクチン",
            scheduled_content: "狂犬病ワクチン",
            scheduled_date: "2026-07-15",
          }),
        });
      });

      test("UT-F-223: 予定完了切り替え：未完了→完了", async () => {
        const user = userEvent.setup();
        render(<CareHomePage />);

        await user.click(
          screen.getByRole("checkbox", { name: "ワクチン接種を完了にする" }),
        );

        expect(apiFetch).toHaveBeenCalledWith("/api/schedules/schedule-1", {
          method: "PATCH",
          body: JSON.stringify({ is_completed: true }),
        });
      });

      test("UT-F-224: 予定完了切り替え：完了→未完了", async () => {
        const user = userEvent.setup();
        const completedSchedule = { ...mockSchedule, is_completed: true };
        (useCareHomeData as jest.Mock).mockReturnValue(
          createMockHookReturn({ schedules: [completedSchedule] }),
        );

        render(<CareHomePage />);

        await user.click(screen.getByRole("checkbox", { checked: true }));

        expect(apiFetch).toHaveBeenCalledWith("/api/schedules/schedule-1", {
          method: "PATCH",
          body: JSON.stringify({ is_completed: false }),
        });
      });

      test("UT-F-225: 予定削除リクエストで確認Modalが開く", async () => {
        const user = userEvent.setup();
        render(<CareHomePage />);

        await user.click(
          screen.getByRole("button", { name: "ワクチン接種のメニューを開く" }),
        );
        await user.click(screen.getByRole("menuitem", { name: "削除" }));

        expect(
          await screen.findByText(
            "「ワクチン接種」を削除します。この操作は取り消せません。",
          ),
        ).toBeInTheDocument();
      });

      test("UT-F-226: 予定削除確認すると該当Scheduleがschedulesから除外される", async () => {
        const user = userEvent.setup();
        render(<CareHomePage />);

        await user.click(
          screen.getByRole("button", { name: "ワクチン接種のメニューを開く" }),
        );
        await user.click(screen.getByRole("menuitem", { name: "削除" }));
        await user.click(screen.getByRole("button", { name: /削除/ }));

        expect(apiFetch).toHaveBeenCalledWith("/api/schedules/schedule-1", {
          method: "DELETE",
        });
      });
    });

    describe("ペット切り替え", () => {
      test("UT-F-227: petListが1匹のみの場合、切り替えボタンをクリックしてもModalは開かない", async () => {
        const user = userEvent.setup();
        (useCareHomeData as jest.Mock).mockReturnValue(
          createMockHookReturn({ petList: [mockPet] }),
        );

        render(<CareHomePage />);

        await user.click(
          screen.getByRole("button", { name: "ペットを切り替える" }),
        );

        // Modal内に表示されるはずの要素（ペット一覧の見出し等）が出ないことを確認
        // 具体的な文言は未確認のため、ここでは送信ボタン等で判定可能な範囲に留める
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      test("UT-F-228: petListが2匹以上の場合、切り替えボタンをクリックするとPetSwitchModalが開く", async () => {
        const user = userEvent.setup();
        const secondPet = {
          ...mockPet,
          id: "pet-2",
          name: "たま",
          species: "cat" as const,
        };
        (useCareHomeData as jest.Mock).mockReturnValue(
          createMockHookReturn({ petList: [mockPet, secondPet] }),
        );

        render(<CareHomePage />);

        await user.click(
          screen.getByRole("button", { name: "ペットを切り替える" }),
        );

        expect(await screen.findByRole("dialog")).toBeInTheDocument();
      });

      test("UT-F-229: ペットを選択するとpetが切り替わりModalが閉じる", async () => {
        const user = userEvent.setup();
        const mockSetPet = jest.fn();
        const secondPet = {
          ...mockPet,
          id: "pet-2",
          name: "たま",
          species: "cat" as const,
        };
        (useCareHomeData as jest.Mock).mockReturnValue(
          createMockHookReturn({
            petList: [mockPet, secondPet],
            setPet: mockSetPet,
          }),
        );

        render(<CareHomePage />);

        await user.click(
          screen.getByRole("button", { name: "ペットを切り替える" }),
        );
        await user.click(await screen.findByText("たま"));

        expect(mockSetPet).toHaveBeenCalledWith(secondPet);
      });
    });

    describe("条件表示", () => {
      test("UT-F-230: pet.hospital_phoneが存在する場合EmergencyCallButtonが表示される", () => {
        render(<CareHomePage />);
        expect(
          screen.getByRole("link", { name: "緊急発信" }),
        ).toBeInTheDocument();
      });

      test("UT-F-231: pet.hospital_phoneが存在しない場合EmergencyCallButtonが表示されない", () => {
        (useCareHomeData as jest.Mock).mockReturnValue(
          createMockHookReturn({ pet: { ...mockPet, hospital_phone: null } }),
        );

        render(<CareHomePage />);

        expect(
          screen.queryByRole("link", { name: "緊急発信" }),
        ).not.toBeInTheDocument();
      });

      test("UT-F-232: isMounted=trueの場合日付ラベルが表示される", () => {
        render(<CareHomePage />);
        expect(screen.getByText(/2026年6月30日/)).toBeInTheDocument();
      });

      test("UT-F-233: isMounted=falseの場合日付ラベルが表示されない", () => {
        (useCareHomeData as jest.Mock).mockReturnValue(
          createMockHookReturn({ isMounted: false }),
        );

        render(<CareHomePage />);

        expect(screen.queryByText(/年.*月.*日/)).not.toBeInTheDocument();
      });
    });
  });
});
