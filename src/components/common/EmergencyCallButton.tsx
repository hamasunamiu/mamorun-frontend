import { Phone } from "lucide-react";

type EmergencyCallButtonProps = {
  /** かかりつけ医の電話番号（tel:リンク用） */
  phoneNumber: string;
};

export function EmergencyCallButton({ phoneNumber }: EmergencyCallButtonProps) {
  return (
    <a
      href={`tel:${phoneNumber}`}
      className="flex min-h-11 items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-destructive"
      aria-label="緊急発信"
    >
      <Phone className="h-[18px] w-[18px]" aria-hidden="true" />
      <span className="text-xs font-medium">緊急発信</span>
    </a>
  );
}