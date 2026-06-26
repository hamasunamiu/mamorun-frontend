"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import type { Profile, Pet, Todo, Schedule } from "./types";
import {
  MOCK_PROFILE,
  MOCK_PET,
  MOCK_PET_LIST,
  MOCK_TODOS,
  MOCK_SCHEDULES,
} from "./mockData";

// ▼ 動作確認用フラグ：バックエンド接続後は false に変更、または関連コードを削除すること
const USE_MOCK_DATA = true;

export function useCareHomeData() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [pet, setPet] = useState<Pet | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [petList, setPetList] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ------------------------------------------------------------
  // データ取得（ステップ1：土台作り）
  // ------------------------------------------------------------

  useEffect(() => {
    // ① GET /api/profiles/me で pet_id を取得
    // ② pet_id が null の場合（DB設計書の「状態B：未ペアリング」）は UI-001 へリダイレクト
    //    本来は Next.js Middleware が担う想定だが、未実装の可能性も考慮しこの画面側でも軽くガードする
    // ③ pet_id がある場合は GET /api/pets/:petId でペット情報・病院電話番号を取得
    const fetchInitialData = async () => {
      setIsLoading(true);
      setLoadError(null);

      // ▼▼▼ 動作確認用：バックエンド未接続のため一時的にモックデータを使用 ▼▼▼
      // バックエンド接続後、この if ブロックを削除し、下のコメントアウトを元に戻すこと
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 300)); // ローディング表示の確認用に少し待たせる
        setProfile(MOCK_PROFILE);
        setPet(MOCK_PET);
        setPetList(MOCK_PET_LIST);
        setTodos(MOCK_TODOS);
        setSchedules(MOCK_SCHEDULES);
        setIsLoading(false);
        return;
      }
      // ▲▲▲ 動作確認用ここまで ▲▲▲

      try {
        const profileData = await apiFetch<Profile>("/api/profiles/me");
        setProfile(profileData);

        if (!profileData.pet_id) {
          // 未ペアリング状態：お世話ホームを表示する前提が崩れるため初期登録画面へ
          router.push("/login");
          return;
        }

        const petData = await apiFetch<Pet>(`/api/pets/${profileData.pet_id}`);
        setPet(petData);
      } catch (err) {
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "データの取得に失敗しました。時間をおいて再度お試しください。"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [router]);

  // ------------------------------------------------------------
  // マウント完了フラグ（ハイドレーションミスマッチ対策）
  // ------------------------------------------------------------

  useEffect(() => {
    // マウント完了をフラグで示すだけにする（cascading render警告を回避）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // ------------------------------------------------------------
  // Supabase Realtime：todosテーブルの変更を監視
  // ------------------------------------------------------------

  useEffect(() => {
    // ★【最重要】バックエンドからの指示通り、変更通知を受け取った際は再fetchせず、
    // payload.new / payload.old を使ってstateを直接更新する（再fetchはキャッシュ競合の原因になるため禁止）。
    // pet.idが確定する前にフィルタを組み立てると意味のないチャンネルになるため、
    // pet?.id が存在する場合のみリスナーを登録する。
    if (!pet?.id) return;

    const channel = supabase
      .channel(`todos-changes-${pet.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "todos",
          filter: `pet_id=eq.${pet.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newTodo = payload.new as Todo;
            setTodos((prevTodos) => {
              // 同じIDが既に存在する場合は重複追加しない（自分自身の操作分との重複防止）
              if (prevTodos.some((todo) => todo.id === newTodo.id)) {
                return prevTodos;
              }
              return [...prevTodos, newTodo];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedTodo = payload.new as Todo;
            setTodos((prevTodos) =>
              prevTodos.map((todo) =>
                todo.id === updatedTodo.id ? updatedTodo : todo
              )
            );
          } else if (payload.eventType === "DELETE") {
            const deletedTodo = payload.old as Todo;
            setTodos((prevTodos) =>
              prevTodos.filter((todo) => todo.id !== deletedTodo.id)
            );
          }
        }
      )
      .subscribe();

    // ★重要：コンポーネントが画面から消える時（クリーンアップ時）に、
    // 必ずチャンネルの登録を解除する。これを忘れると、画面を何度も開閉した際に
    // 同じイベントを複数回受け取ってしまう不具合の原因になる
    return () => {
      supabase.removeChannel(channel);
    };
  }, [pet?.id]);

  return {
    profile,
    pet,
    setPet,
    todos,
    setTodos,
    schedules,
    setSchedules,
    petList,
    isLoading,
    loadError,
    isMounted,
  };
}