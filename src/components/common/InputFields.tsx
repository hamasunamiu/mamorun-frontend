import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import type { ComponentProps } from "react";

type InputFieldProps = ComponentProps<typeof Input> & {
  /** 入力欄のラベル */
  label: string;
  /** 必須項目かどうか（ラベル横に*を表示） */
  required?: boolean;
  /** バリデーションエラーメッセージ */
  error?: string;
};

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, required, error, id, className, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={inputId} className="text-sm text-foreground">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        <Input
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn("min-h-11", error && "border-destructive", className)}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";