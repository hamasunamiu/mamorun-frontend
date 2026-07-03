"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import { getSelectedPetId, clearSelectedPetId } from "@/lib/petStorage";
import type { Profile, Pet, Todo, Schedule, Member } from "./types";

export function useCareHomeData() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [pet, setPet] = useState<Pet | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [petList, setPetList] = useState<Pet[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const membersRef = useRef<Member[]>([]);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

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

      try {
        const profileData = await apiFetch<Profile>("/api/profiles/me");
        setProfile(profileData);

        if (!profileData.pet_id) {
          // 未ペアリング状態：お世話ホームを表示する前提が崩れるため初期登録画面へ
          router.push("/login");
          return;
        }

        //ペット・ToDo・スケジュール・ペット一覧を並行取得
        const [petData, todosData, schedulesData, petListData, membersData] =
          await Promise.all([
            apiFetch<Pet>(`/api/pets/${profileData.pet_id}`),
            apiFetch<Todo[]>("/api/todos"),
            apiFetch<Schedule[]>("/api/schedules"),
            apiFetch<Pet[]>("/api/pets"),
            apiFetch<Member[]>(`/api/pets/${profileData.pet_id}/members`),
          ]);

        //localStorageに保存されたペットIDがあればそちらを優先
        const savedPetId = getSelectedPetId();
        if (savedPetId && savedPetId !== profileData.pet_id) {
          try {
            const savedPetData = await apiFetch<Pet>(`/api/pets/${savedPetId}`);
            setPet(savedPetData);
            const savedMembersData = await apiFetch<Member[]>(`/api/pets/${savedPetId}/members`);
            setMembers(savedMembersData ?? []);
          } catch {
            setPet(petData);
            clearSelectedPetId();
          }
        } else {
          setPet(petData);
          setMembers(membersData ?? []);
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
    // マウント完了をフラグで示すだけにする（cascading render警告を回避）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // ------------------------------------------------------------
  // Supabase Realtime：invitationsテーブルの変更を監視
  // 新規メンバーが招待を受諾した瞬間（is_used: false→true）を検知し、
  // membersを再取得する。招待受諾時は完全なprofilesレコードがpayloadに
  // 含まれないため、再fetchで対応する（todos/schedulesとは異なる方針）。
  // ------------------------------------------------------------

  useEffect(() => {
    // ★【最重要】バックエンドからの指示通り、変更通知を受け取った際は再fetchせず、
    // payload.new / payload.old を使ってstateを直接更新する（再fetchはキャッシュ競合の原因になるため禁止）。
    // pet.idが確定する前にフィルタを組み立てると意味のないチャンネルになるため、
    // pet?.id が存在する場合のみリスナーを登録する。
    if (!pet?.id) return;

    const channel = supabase
      .channel(`invitations-changes-${pet.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "invitations",
          filter: `pet_id=eq.${pet.id}`,
        },
        (payload) => {
          const oldRow = payload.old as { is_used?: boolean };
          const newRow = payload.old as { is_used?: boolean };

          //is_usedがfalse→trueに変わった瞬間（＝招待受諾成功の瞬間）のみ反応
          if (oldRow.is_used === false && newRow.is_used === true) {
            apiFetch<Member[]>(`/api/pets/${pet.id}/members`)
              .then((membersData) => {
                setMembers(membersData ?? []);
              })
              .catch(() => {
                //メンバー再取得に失敗しても致命的ではないため、
                //静かに失敗させる（次回リロード時に直状態へ復帰する）
              });
          }
        },
      )
      .subscribe();

    // ★重要：コンポーネントが画面から消える時（クリーンアップ時）に、
    // 必ずチャンネルの登録を解除する。これを忘れると、画面を何度も開閉した際に
    // 同じイベントを複数回受け取ってしまう不具合の原因になる
    return () => {
      supabase.removeChannel(channel);
    };
  }, [pet?.id]);

  // ------------------------------------------------------------
  // Supabase Realtime：schedulesテーブルの変更を監視
  // ------------------------------------------------------------

  useEffect(() => {
    // ★【最重要】Todo同様、再fetchせずpayload.new / payload.oldでstateを直接更新する
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
    members,
    setMembers,
    isLoading,
    loadError,
    isMounted,
  };
}
