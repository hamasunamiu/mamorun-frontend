import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import type { ComponentProps } from "react";

type TextAreaFieldProps = ComponentProps<typeof Textarea> & {
  /** 入力欄のラベル */
  label: string;
  /** 必須項目かどうか（ラベル横に*を表示） */
  required?: boolean;
  /** バリデーションエラーメッセージ */
  error?: string;
};

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, required, error, id, className, ...props }, ref) => {
    const textareaId = id ?? props.name;

    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={textareaId} className="text-sm text-foreground">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
          {!required && (
            <span className="ml-1.5 text-xs text-muted-foreground">任意</span>
          )}
        </Label>
        <Textarea
          id={textareaId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          className={cn("min-h-[80px]", error && "border-destructive", className)}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextAreaField.displayName = "TextAreaField";