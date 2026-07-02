const STORAGE_KEY = "selectedPetId";

/** 選択中のペットIDを取得する（未保存の場合はnull） */
export function getSelectedPetId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

/** 選択中のペットIDを保存する */
export function setSelectedPetId(petId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, petId);
}

/** 保存されている選択中ペットIDを削除する */
export function clearSelectedPetId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
