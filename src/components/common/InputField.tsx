import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { forwardRef, useRef } from "react";
import type { ComponentProps } from "react";

type InputFieldProps = ComponentProps<typeof Input> & {
  /** 入力欄のラベル */
  label: string;
  /** 必須項目かどうか（ラベル横に「必須」バッジを表示） */
  required?: boolean;
  /** バリデーションエラーメッセージ */
  error?: string;
};

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, required, error, id, className, onClick, ...props }, ref) => {
    const inputId = id ?? props.name;

    // type="date" の時、入力欄のどこをクリックしてもカレンダーが開くようにするための内部ref。
    // forwardRefで外から渡されたrefとは別に、コンポーネント内部でDOM要素を直接操作するために用意する。
    const innerRef = useRef<HTMLInputElement>(null);

    // 外から渡されたref（forwardRef）と、内部で使うinnerRefの両方に
    // 同じDOM要素をセットするための合成関数（refの合成）
    const setRefs = (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    // type="date" の入力欄をクリックした時、ブラウザ標準のカレンダーピッカーを開く
    // showPicker() は比較的新しいAPIのため、未対応ブラウザ（例：古いSafari）でエラーにならないよう
    // 関数の存在チェックを行ってから呼び出す。
    const handleClick: ComponentProps<typeof Input>["onClick"] = (e) => {
      if (props.type === "date" && innerRef.current?.showPicker) {
        innerRef.current.showPicker();
      }
      onClick?.(e);
    };

    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={inputId} className="text-sm text-foreground">
          {label}
          {/* スクリーンリーダーでも「必須」とそのまま読み上げられるため、
              視覚情報だけに依存しないアクセシブルな必須表示に設定。 */}
          {required && (
            <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
              必須
            </span>
          )}
        </Label>
        <Input
          id={inputId}
          ref={setRefs}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn("min-h-11", error && "border-destructive", className)}
          onClick={handleClick}
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