import { Button } from "@/components/ui/button";
import { PawIcon } from "./PawIcon";
import type { ComponentProps } from "react";

type PrimaryButtonProps = ComponentProps<typeof Button> & {
  /** 肉球アイコンを表示するか（デフォルト: false） */
  showPaw?: boolean;
};

export function PrimaryButton({
  showPaw = false,
  children,
  className,
  ...props
}: PrimaryButtonProps) {
  return (
    <Button className={className} {...props}>
      {showPaw && <PawIcon className="h-[18px] w-[18px]" />}
      {children}
    </Button>
  );
}