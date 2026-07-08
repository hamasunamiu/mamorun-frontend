import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HospitalEditView } from "../HospitalEditView";
import { hospitalSchema } from "../../page";
import type { Pet } from "@/types";

const mockPet: Pet = {
  id: "pet-1",
  name: "むぎ",
  species: "dog",
  gender: "male",
  birthday: "2023-01-01",
  illness: "アレルギー性皮膚炎",
  hospital_name: "〇〇動物病院",
  hospital_phone: "0312345678",
  hospital_address: "東京都渋谷区...",
  hospital_card_image_url: null,
  insurance_card_image_url: null,
  created_at: "2026-01-01T00:00:00.000Z",
};

type HospitalFormValues = {
  hospital_name: string;
  hospital_phone: string;
  hospital_address: string;
};

// HospitalEditViewはreact-hook-formのregister/errorsを直接propsで受け取る設計のため、
// 実際のuseForm()を内部で使う「テスト用のラッパーコンポーネント」を用意する。
// バリデーションルールはpage.tsxからexportされたhospitalSchemaをそのまま使い、
// 本物のルールとテストの間でズレが生じないようにする。
function renderEditView(props?: {
  onSubmitSpy?: () => void;
  onHospitalCardSelect?: (file: File | null) => void;
  onInsuranceCardSelect?: (file: File | null) => void;
  onHospitalCardRemove?: () => void;
  onInsuranceCardRemove?: () => void;
  saveError?: string | null;
  isSubmitting?: boolean;
  onCancel?: () => void;
  defaultValues?: Partial<HospitalFormValues>;
}) {
  function Wrapper() {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<HospitalFormValues>({
      resolver: zodResolver(hospitalSchema),
      defaultValues: {
        hospital_name: "",
        hospital_phone: "",
        hospital_address: "",
        ...props?.defaultValues,
      },
    });

    return (
      <HospitalEditView
        pet={mockPet}
        onSubmit={handleSubmit(props?.onSubmitSpy ?? jest.fn())}
        register={register}
        errors={errors}
        onHospitalCardSelect={props?.onHospitalCardSelect ?? jest.fn()}
        onInsuranceCardSelect={props?.onInsuranceCardSelect ?? jest.fn()}
        onHospitalCardRemove={props?.onHospitalCardRemove ?? jest.fn()}
        onInsuranceCardRemove={props?.onInsuranceCardRemove ?? jest.fn()}
        saveError={props?.saveError ?? null}
        isSubmitting={props?.isSubmitting ?? false}
        onCancel={props?.onCancel ?? jest.fn()}
      />
    );
  }

  return render(<Wrapper />);
}

describe("HospitalEditView", () => {
  test("UT-F-328: 病院名未入力で送信するとエラーメッセージが表示される", async () => {
    const user = userEvent.setup();
    renderEditView();

    await user.click(screen.getByRole("button", { name: "保存する" }));

    expect(
      await screen.findByText("病院名を入力してください"),
    ).toBeInTheDocument();
  });

  test("UT-F-329: 病院名が250文字を超える場合エラーメッセージが表示される", async () => {
    const user = userEvent.setup();
    renderEditView();

    await user.type(screen.getByLabelText(/病院名/), "あ".repeat(251));
    await user.click(screen.getByRole("button", { name: "保存する" }));

    expect(
      await screen.findByText("250文字以内で入力してください"),
    ).toBeInTheDocument();
  }, 10000);

  test("UT-F-330: 電話番号未入力で送信するとエラーメッセージが表示される", async () => {
    const user = userEvent.setup();
    renderEditView();

    await user.type(screen.getByLabelText(/病院名/), "〇〇動物病院");
    await user.click(screen.getByRole("button", { name: "保存する" }));

    expect(
      await screen.findByText("電話番号を入力してください"),
    ).toBeInTheDocument();
  });

  test("UT-F-331: 電話番号が50文字を超える場合エラーメッセージが表示される", async () => {
    const user = userEvent.setup();
    renderEditView();

    await user.type(screen.getByLabelText(/病院名/), "〇〇動物病院");
    await user.type(screen.getByLabelText(/電話番号/), "1".repeat(51));
    await user.click(screen.getByRole("button", { name: "保存する" }));

    expect(
      await screen.findByText("50文字以内で入力してください"),
    ).toBeInTheDocument();
  }, 10000);

  test("UT-F-332: 電話番号に半角数字以外が含まれる場合エラーメッセージが表示される", async () => {
    const user = userEvent.setup();
    renderEditView();

    await user.type(screen.getByLabelText(/病院名/), "〇〇動物病院");
    await user.type(screen.getByLabelText(/電話番号/), "03-1234-5678");
    await user.click(screen.getByRole("button", { name: "保存する" }));

    expect(
      await screen.findByText("半角数字のみ使用できます"),
    ).toBeInTheDocument();
  });

  test("UT-F-333: 住所未入力で送信するとエラーメッセージが表示される", async () => {
    const user = userEvent.setup();
    renderEditView();

    await user.type(screen.getByLabelText(/病院名/), "〇〇動物病院");
    await user.type(screen.getByLabelText(/電話番号/), "0312345678");
    await user.click(screen.getByRole("button", { name: "保存する" }));

    expect(
      await screen.findByText("住所を入力してください"),
    ).toBeInTheDocument();
  });

  test("UT-F-334: 住所が100文字を超える場合エラーメッセージが表示される", async () => {
    const user = userEvent.setup();
    renderEditView();

    await user.type(screen.getByLabelText(/病院名/), "〇〇動物病院");
    await user.type(screen.getByLabelText(/電話番号/), "0312345678");
    await user.type(screen.getByLabelText(/住所/), "あ".repeat(101));
    await user.click(screen.getByRole("button", { name: "保存する" }));

    expect(
      await screen.findByText("100文字以内で入力してください"),
    ).toBeInTheDocument();
  }, 10000);

  test("UT-F-335: 診察券の画像を選択するとonHospitalCardSelectが呼ばれる", async () => {
    const user = userEvent.setup();
    const mockOnHospitalCardSelect = jest.fn();
    const { container } = renderEditView({
      onHospitalCardSelect: mockOnHospitalCardSelect,
    });

    const file = new File(["dummy"], "card.png", { type: "image/png" });
    // ImageUploaderが2つあるため、診察券（1つ目）のinput[type=file]を直接取得する
    const fileInputs = container.querySelectorAll('input[type="file"]');
    await user.upload(fileInputs[0] as HTMLInputElement, file);

    expect(mockOnHospitalCardSelect).toHaveBeenCalledWith(file);
  });

  test("UT-F-336: 保険証の画像を選択するとonInsuranceCardSelectが呼ばれる", async () => {
    const user = userEvent.setup();
    const mockOnInsuranceCardSelect = jest.fn();
    const { container } = renderEditView({
      onInsuranceCardSelect: mockOnInsuranceCardSelect,
    });

    const file = new File(["dummy"], "insurance.png", { type: "image/png" });
    // 2つ目（保険証）のinput[type=file]を取得する
    const fileInputs = container.querySelectorAll('input[type="file"]');
    await user.upload(fileInputs[1] as HTMLInputElement, file);

    expect(mockOnInsuranceCardSelect).toHaveBeenCalledWith(file);
  });

  test("UT-F-337: 「キャンセル」ボタンクリックでonCancelが呼ばれる", async () => {
    const user = userEvent.setup();
    const mockOnCancel = jest.fn();
    renderEditView({ onCancel: mockOnCancel });

    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test("UT-F-338: 編集フォームにillnessの入力欄が存在しない", () => {
    renderEditView();

    expect(screen.queryByLabelText(/持病/)).not.toBeInTheDocument();
  });

  test("UT-F-339: isSubmitting=trueの場合保存ボタンがdisabledになりLoadingSpinnerが表示される", () => {
    renderEditView({ isSubmitting: true });

    expect(screen.getByRole("button", { name: "読み込み中" })).toBeDisabled();
  });
});
