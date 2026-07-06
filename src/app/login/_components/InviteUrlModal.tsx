import { Modal } from "@/components/common/Modal";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { PawPrint } from "lucide-react";

type InviteUrlModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InviteUrlModal({ open, onOpenChange }: InviteUrlModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="招待URLをお持ちの方"
      footer={
        <PrimaryButton
          className="h-12 w-full text-sm font-semibold"
          onClick={() => onOpenChange(false)}
        >
          閉じる
        </PrimaryButton>
      }
    >
      <div className="flex flex-col items-center gap-3 py-2">
        <div
          data-testid="invite-url-modal-icon"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent"
        >
          <PawPrint
            className="h-7 w-7 text-accent-foreground"
            aria-hidden="true"
          />
        </div>
        <p
          data-testid="invite-url-modal-description"
          className="text-center text-sm leading-relaxed text-accent-foreground"
        >
          家族から届いた招待URLをタップすると
          <br />
          専用の登録画面にご案内します。
          <br />
          <br />
          このボタンからは登録できないので
          <br />
          届いたURLからアクセスしてくださいね！
        </p>
      </div>
    </Modal>
  );
}
