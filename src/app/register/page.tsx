"use client";
import { Suspense } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, UserPlus } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputField } from "@/components/common/InputField";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { useRegisterSubmit } from "./_components/useRegisterSubmit";
import { PetFormSection } from "./_components/PetFormSection";

const petSchema = z.object({
  species: z.enum(["dog", "cat"], { message: "犬または猫を選択してください" }),
  name: z
    .string()
    .min(1, "名前を入力してください")
    .max(50, "50文字以内で入力してください"),
  gender: z.enum(["male", "female"], { message: "性別を選択してください" }),
  birthday: z
    .string()
    .min(1, "正しい日付を入力してください")
    .refine((val) => new Date(val) <= new Date(), {
      message: "生年月日に未来の日付は設定できません",
    }),
  illness: z
    .string()
    .max(1000, "1000文字以内で入力してください")
    .optional()
    .or(z.literal("")),
});

const registerSchema = z.object({
  displayName: z
    .string()
    .min(1, "お名前を入力してください")
    .max(50, "50文字以内で入力してください"),
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("正しいメールアドレスの形式で入力してください"),
  password: z
    .string()
    .min(1, "パスワードを入力してください")
    .min(8, "8文字以上で入力してください"),
  pets: z.array(petSchema),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

const EMPTY_PET = {
  species: undefined,
  name: "",
  gender: undefined,
  birthday: "",
  illness: "",
} as unknown as RegisterFormValues["pets"][number];

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token");

  const {
    authError,
    isEmailDuplicateError,
    isSubmitting,
    inviteError,
    clearInviteError,
    submit,
  } = useRegisterSubmit(inviteToken);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      pets: inviteToken ? [] : [EMPTY_PET],
    },

  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "pets",
  });

  const onSubmit = async (values: RegisterFormValues) => {
    const success = await submit(values);
    if (success) {
      router.push("/home");
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF8F6]">
      <div
        className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-6 py-8"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 2rem)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)",
        }}
      >
        <h1 className="text-xl font-bold text-[#5C4631]">アカウント登録</h1>
        <p className="mt-1 text-sm text-[#8a6d54] font-bold">
          {inviteToken
            ? "招待された家族として参加しましょう"
            : "ペット情報もあわせて登録しましょう"}
        </p>

        <form
          noValidate
          // eslint-disable-next-line react-hooks/refs -- handleSubmitはイベントハンドラを返すだけで、render中にonSubmit内のref.currentを読むことはないため誤検知
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 flex flex-col gap-6"
        >
          {/* アカウント情報 */}
          <section className="flex flex-col gap-3 rounded-2xl bg-white p-4">
            <h2 className="flex items-center gap-1.5 text-lg font-semibold text-[#6E5849]">
              <UserPlus className="h-5 w-5" aria-hidden="true" />
              アカウント情報
            </h2>
            <InputField
              label="ニックネーム"
              required
              data-testid="ui001a-displayname-input"
              placeholder="例：花子"
              className="border-[#a8825f] placeholder:text-[#8a6d54]"
              {...register("displayName")}
              error={errors.displayName?.message}
            />
            <InputField
              label="メールアドレス"
              required
              data-testid="ui001a-email-input"
              type="email"
              placeholder="example@email.com"
              className="border-[#a8825f] placeholder:text-[#8a6d54]"
              {...register("email")}
              error={errors.email?.message}
            />
            <InputField
              label="パスワード"
              required
              type="password"
              data-testid="ui001a-password-input"
              placeholder="8文字以上"
              className="border-[#a8825f] placeholder:text-[#8a6d54]"
              {...register("password")}
              error={errors.password?.message}
            />
          </section>

          {/* ペット情報（複数）：招待経由の場合は表示しない */}
          {!inviteToken && (
            <>
              {fields.map((field, index) => (
                <PetFormSection
                  key={field.id}
                  index={index}
                  control={control}
                  register={register}
                  errors={errors}
                  canRemove={fields.length > 1}
                  onRemove={() => remove(index)}
                />
              ))}

              <button
                type="button"
                data-testid="ui001a-add-pet-button"
                onClick={() => append(EMPTY_PET)}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#a8825f] py-2.5 text-sm text-[#8a6d54]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                ペットを追加する
              </button>
            </>
          )}

          {authError && (
            <div className="flex flex-col gap-2">
              <ErrorMessage message={authError} />
              {/* メールアドレス重複エラーの時だけログイン画面への誘導リンクを表示 */}
              {isEmailDuplicateError && (
                <Link
                  href="/login"
                  className="text-sm font-medium text-[#8a6d54] underline underline-offset-2"
                >
                  ログイン画面へ
                </Link>
              )}
            </div>
          )}

          <PrimaryButton
            type="submit"
            showPaw
            data-testid="ui001a-submit-button"
            disabled={isSubmitting}
            className="h-14 rounded-3xl bg-primary text-base hover:bg-primary hover:opacity-85"
          >
            {isSubmitting ? <LoadingSpinner size="sm" /> : "登録する"}
          </PrimaryButton>
        </form>
      </div>

      {/* OKボタン押下だけでなく、背景クリック・Escキーでの閉じる操作（onOpenChange）でも
          例外なく /login へ遷移させる（任意の閉じ方で離脱できてしまうのを防ぐ） */}
      <Modal
        open={inviteError !== null}
        onOpenChange={(open) => {
          if (!open) {
            clearInviteError();
            router.push("/login");
          }
        }}
        title={inviteError?.title ?? ""}
        description={inviteError?.description}
        footer={
          <PrimaryButton
            type="button"
            onClick={() => router.push("/login")}
            className="rounded-3xl bg-primary hover:bg-primary hover:opacity-85"
          >
            ログイン画面へ
          </PrimaryButton>
        }
      />
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RegisterPageContent />
    </Suspense>
  );
}
