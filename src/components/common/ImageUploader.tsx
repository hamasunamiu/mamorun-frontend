"use client";

import { useState, useRef, useEffect } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorMessage } from "./ErrorMessage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

type ImageUploaderProps = {
  /** ラベル（例：「診察券」「保険証」） */
  label: string;
  /** 必須項目かどうか */
  required?: boolean;
  /** ファイルが選択された時のコールバック（バリデーション通過後のみ呼ばれる） */
  onFileSelect: (file: File) => void;
  /** すでにアップロード済みの画像URL（編集時の初期表示用） */
  initialImageUrl?: string;
};

export function ImageUploader({
  label,
  required = false,
  onFileSelect,
  initialImageUrl,
}: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialImageUrl ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("jpg・png・webp形式の画像を選択してください");
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError("5MB以内の画像を選択してください");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
    onFileSelect(file);
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-foreground">
        {label}
        {required ? (
          <span className="ml-0.5 text-destructive">*</span>
        ) : (
          <span className="ml-1.5 text-xs text-muted-foreground">任意</span>
        )}
      </label>

      {previewUrl ? (
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-md border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={`${label}のプレビュー`}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            aria-label="画像を削除"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label
          className={cn(
            "flex aspect-[3/2] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-muted/30 px-4 py-4 text-center",
          )}
        >
          <ImagePlus
            className="h-6 w-6 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="text-xs text-muted-foreground">
            タップして画像を追加
          </span>
          <span className="text-[11px] text-muted-foreground">
            jpg / png / webp・5MB以内
          </span>
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>
      )}

      {error && <ErrorMessage message={error} />}
    </div>
  );
}
