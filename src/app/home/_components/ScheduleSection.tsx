"use client";

import { ScheduleCard } from "./ScheduleCard";
import { formatDaysUntil } from "@/lib/dateFormat";
import type { Schedule } from "./types";

type ScheduleSectionProps = {
  schedules: Schedule[];
  isMounted: boolean;
  onAddClick: () => void;
  onToggle: (scheduleId: string) => void;
  onDeleteRequest: (schedule: Schedule) => void;
  onEdit: (schedule: Schedule) => void;
};

export function ScheduleSection({
  schedules,
  isMounted,
  onAddClick,
  onToggle,
  onDeleteRequest,
  onEdit,
}: ScheduleSectionProps) {
  return (
    <section className="mt-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-md font-semibold text-[#6E5849]">
          🗓️ 今後の予定
        </h2>
        <button
          type="button"
          onClick={onAddClick}
          className="flex min-h-11 items-center gap-1 rounded-lg border border-[#D8C0A8] px-2.5 text-xs font-bold text-[#993C1D]"
        >
          予定を追加
        </button>
      </div>

      {schedules.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          今後の予定はまだ登録されていません
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {schedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              title={schedule.title}
              content={schedule.scheduled_content}
              daysUntilLabel={
                isMounted
                  ? formatDaysUntil(schedule.scheduled_date, new Date())
                  : ""
              }
              isCompleted={schedule.is_completed}
              onToggle={() => onToggle(schedule.id)}
              onDelete={() => onDeleteRequest(schedule)}
              onEdit={() => onEdit(schedule)}
            />
          ))}
        </div>
      )}
    </section>
  );
}