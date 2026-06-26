import { Phone } from "lucide-react";

type EmergencyCallButtonProps = {
  /** かかりつけ医の電話番号（tel:リンク用） */
  phoneNumber: string;
};

export function EmergencyCallButton({ phoneNumber }: EmergencyCallButtonProps) {
  return (
    <a
      href={`tel:${phoneNumber}`}
      className="flex min-h-14 items-center gap-2 rounded-lg bg-destructive/10 px-10 py-2.5 text-destructive"
      aria-label="緊急発信"
    >
      <Phone className="h-6 w-6" aria-hidden="true" />
      <span className="text-sm font-bold">緊急発信</span>
    </a>
  );
}