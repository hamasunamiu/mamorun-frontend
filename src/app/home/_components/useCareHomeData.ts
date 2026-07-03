"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import { getSelectedPetId, clearSelectedPetId } from "@/lib/petStorage";
import type { Profile, Pet, Todo, Schedule } from "./types";

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

  // ★追加：ペット切り替え専用のローディング・エラーstate
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  // ------------------------------------------------------------
  // データ取得（ステップ1：土台作り）
  // ------------------------------------------------------------

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const profileData = await apiFetch<Profile>("/api/profiles/me");
        setProfile(profileData);

        if (!profileData.pet_id) {
          router.push("/login");
          return;
        }

        const [petData, todosData, schedulesData, petListData] =
          await Promise.all([
            apiFetch<Pet>(`/api/pets/${profileData.pet_id}`),
            apiFetch<Todo[]>("/api/todos"),
            apiFetch<Schedule[]>("/api/schedules"),
            apiFetch<Pet[]>("/api/pets"),
          ]);

        const savedPetId = getSelectedPetId();
        if (savedPetId && savedPetId !== profileData.pet_id) {
          try {
            const savedPetData = await apiFetch<Pet>(`/api/pets/${savedPetId}`);
            setPet(savedPetData);
            // ★追加：保存されていたペットのToDo・予定も合わせて取得する
            const [savedTodos, savedSchedules] = await Promise.all([
              apiFetch<Todo[]>(`/api/todos?petId=${savedPetId}`),
              apiFetch<Schedule[]>(`/api/schedules?petId=${savedPetId}`),
            ]);
            setTodos(savedTodos ?? []);
            setSchedules(savedSchedules ?? []);
            setPetList(petListData ?? []);
            return;
          } catch {
            setPet(petData);
            clearSelectedPetId();
          }
        } else {
          setPet(petData);
        }
        setTodos(todosData ?? []);
        setSchedules(schedulesData ?? []);
        setPetList(petListData ?? []);
      } catch (err) {
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "データの取得に失敗しました。時間をおいて再度お試しください。",
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // ------------------------------------------------------------
  // ★追加：ペット切り替え時の再取得処理
  // ------------------------------------------------------------
  // バックエンドの petId クエリパラメータ対応後に有効化される想定。
  // 対応前は petId が無視され、代表ペット（profiles.pet_id）のデータが
  // 返ってくるだけなので、挙動は変わらない（安全にマージ可能）。
  const switchToPet = async (selectedPet: Pet) => {
    setIsSwitching(true);
    setSwitchError(null);

    try {
      const [todosData, schedulesData] = await Promise.all([
        apiFetch<Todo[]>(`/api/todos?petId=${selectedPet.id}`),
        apiFetch<Schedule[]>(`/api/schedules?petId=${selectedPet.id}`),
      ]);

      setPet(selectedPet);
      setTodos(todosData ?? []);
      setSchedules(schedulesData ?? []);
    } catch (err) {
      setSwitchError(
        err instanceof ApiError
          ? err.message
          : "ペットの切り替えに失敗しました。時間をおいて再度お試しください。",
      );
      // 失敗時はペット表示・データともに切り替えない（元の状態を維持）
    } finally {
      setIsSwitching(false);
    }
  };

  // ------------------------------------------------------------
  // Supabase Realtime：todosテーブルの変更を監視
  // ------------------------------------------------------------

  useEffect(() => {
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
              if (prevTodos.some((todo) => todo.id === newTodo.id)) {
                return prevTodos;
              }
              return [...prevTodos, newTodo];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedTodo = payload.new as Todo;
            setTodos((prevTodos) =>
              prevTodos.map((todo) => {
                if (todo.id !== updatedTodo.id) return todo;
                return {
                  ...todo,
                  ...updatedTodo,
                  completed_by: updatedTodo.is_completed
                    ? todo.completed_by
                    : null,
                };
              }),
            );
          } else if (payload.eventType === "DELETE") {
            const deletedTodo = payload.old as Todo;
            setTodos((prevTodos) =>
              prevTodos.filter((todo) => todo.id !== deletedTodo.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pet?.id]);

  // ------------------------------------------------------------
  // Supabase Realtime：schedulesテーブルの変更を監視
  // ------------------------------------------------------------

  useEffect(() => {
    if (!pet?.id) return;

    const channel = supabase
      .channel(`schedules-changes-${pet.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "schedules",
          filter: `pet_id=eq.${pet.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newSchedule = payload.new as Schedule;
            setSchedules((prevSchedules) => {
              if (prevSchedules.some((s) => s.id === newSchedule.id)) {
                return prevSchedules;
              }
              return [...prevSchedules, newSchedule];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedSchedule = payload.new as Schedule;
            setSchedules((prevSchedules) =>
              prevSchedules.map((s) =>
                s.id === updatedSchedule.id ? updatedSchedule : s,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            const deletedSchedule = payload.old as Schedule;
            setSchedules((prevSchedules) =>
              prevSchedules.filter((s) => s.id !== deletedSchedule.id),
            );
          }
        },
      )
      .subscribe();

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
    // ★追加
    switchToPet,
    isSwitching,
    switchError,
  };
}
