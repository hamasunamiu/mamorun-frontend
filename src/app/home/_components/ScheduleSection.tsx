"use client";

import { PrimaryButton } from "@/components/common/PrimaryButton";
import { CalendarDays } from "lucide-react";
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
        <h2 className="flex items-center gap-1.5 text-lg font-semibold text-[#6E5849]">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          今後の予定
        </h2>
        <PrimaryButton
          type="button"
          variant="outline"
          data-testid="ui002-schedule-add-button"
          onClick={onAddClick}
          className="min-h-11 border-2 border-accent-foreground/30 text-xs font-bold text-accent-foreground hover:bg-accent hover:text-accent-foreground"
        >
          予定を追加
        </PrimaryButton>
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
