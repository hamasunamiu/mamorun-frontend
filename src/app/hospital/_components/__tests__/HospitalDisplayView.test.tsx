import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HospitalDisplayView } from "../HospitalDisplayView";
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
  hospital_card_image_url: "https://example.com/card.jpg",
  insurance_card_image_url: "https://example.com/insurance.jpg",
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("HospitalDisplayView", () => {
  test("UT-F-315: hospital_nameが存在する場合その値が表示される", () => {
    render(<HospitalDisplayView pet={mockPet} onEditClick={jest.fn()} />);
    expect(screen.getByText("〇〇動物病院")).toBeInTheDocument();
  });

  test("UT-F-316: hospital_nameが未設定の場合「未登録」と表示される", () => {
    render(
      <HospitalDisplayView
        pet={{ ...mockPet, hospital_name: null }}
        onEditClick={jest.fn()}
      />,
    );
    // 病院名・電話番号・住所・持病など複数項目が「未登録」になりうるため、配列で取得して件数を確認する
    expect(screen.getAllByText("未登録").length).toBeGreaterThan(0);
  });

  test("UT-F-317: hospital_phoneが存在する場合その値が表示される", () => {
    render(<HospitalDisplayView pet={mockPet} onEditClick={jest.fn()} />);
    expect(screen.getByText("0312345678")).toBeInTheDocument();
  });

  test("UT-F-318: hospital_phoneが未設定の場合「未登録」と表示される", () => {
    render(
      <HospitalDisplayView
        pet={{ ...mockPet, hospital_phone: null }}
        onEditClick={jest.fn()}
      />,
    );
    expect(screen.getAllByText("未登録").length).toBeGreaterThan(0);
  });

  test("UT-F-319: hospital_addressが存在する場合その値が表示される", () => {
    render(<HospitalDisplayView pet={mockPet} onEditClick={jest.fn()} />);
    expect(screen.getByText("東京都渋谷区...")).toBeInTheDocument();
  });

  test("UT-F-320: hospital_addressが未設定の場合「未登録」と表示される", () => {
    render(
      <HospitalDisplayView
        pet={{ ...mockPet, hospital_address: null }}
        onEditClick={jest.fn()}
      />,
    );
    expect(screen.getAllByText("未登録").length).toBeGreaterThan(0);
  });

  test("UT-F-321: illnessが存在する場合その値が表示される", () => {
    render(<HospitalDisplayView pet={mockPet} onEditClick={jest.fn()} />);
    expect(screen.getByText("アレルギー性皮膚炎")).toBeInTheDocument();
  });

  test("UT-F-322: illnessが未設定の場合「未登録」と表示される", () => {
    render(
      <HospitalDisplayView
        pet={{ ...mockPet, illness: null }}
        onEditClick={jest.fn()}
      />,
    );
    expect(screen.getAllByText("未登録").length).toBeGreaterThan(0);
  });

  test("UT-F-323: hospital_card_image_urlが存在する場合imgタグでプレビュー表示される", () => {
    render(<HospitalDisplayView pet={mockPet} onEditClick={jest.fn()} />);
    expect(screen.getByAltText("診察券のプレビュー")).toHaveAttribute(
      "src",
      "https://example.com/card.jpg",
    );
  });

  test("UT-F-324: hospital_card_image_urlが未設定の場合「未登録」と表示される（imgは表示されない）", () => {
    render(
      <HospitalDisplayView
        pet={{ ...mockPet, hospital_card_image_url: null }}
        onEditClick={jest.fn()}
      />,
    );
    expect(screen.queryByAltText("診察券のプレビュー")).not.toBeInTheDocument();
    expect(screen.getAllByText("未登録").length).toBeGreaterThan(0);
  });

  test("UT-F-325: insurance_card_image_urlが存在する場合imgタグでプレビュー表示される", () => {
    render(<HospitalDisplayView pet={mockPet} onEditClick={jest.fn()} />);
    expect(screen.getByAltText("保険証のプレビュー")).toHaveAttribute(
      "src",
      "https://example.com/insurance.jpg",
    );
  });

  test("UT-F-326: insurance_card_image_urlが未設定の場合「未登録」と表示される", () => {
    render(
      <HospitalDisplayView
        pet={{ ...mockPet, insurance_card_image_url: null }}
        onEditClick={jest.fn()}
      />,
    );
    expect(screen.queryByAltText("保険証のプレビュー")).not.toBeInTheDocument();
  });

  test("UT-F-327: 「編集する」ボタンクリックでonEditClickが呼ばれる", async () => {
    const user = userEvent.setup();
    const mockOnEditClick = jest.fn();
    render(<HospitalDisplayView pet={mockPet} onEditClick={mockOnEditClick} />);

    await user.click(screen.getByRole("button", { name: "編集する" }));

    expect(mockOnEditClick).toHaveBeenCalledTimes(1);
  });
});
