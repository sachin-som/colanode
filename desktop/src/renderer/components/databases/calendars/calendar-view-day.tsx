import React from 'react';
import { cn, isSameDay } from '@/lib/utils';
import { RecordNode } from '@/types/databases';
import { CalendarViewCard } from '@/renderer/components/databases/calendars/calendar-view-card';
import { Plus } from 'lucide-react';

interface CalendarViewDayProps {
  date: Date;
  month: Date;
  records: RecordNode[];
}

export const CalendarViewDay = ({
  date,
  month,
  records,
}: CalendarViewDayProps) => {
  const isToday = isSameDay(date, new Date());
  const canCreateRecord = false;

  const dateMonth = date.getMonth();
  const displayMonth = month.getMonth();
  const isOutside = dateMonth !== displayMonth;

  return (
    <div className="animate-fade-in group flex h-full w-full flex-col gap-1">
      <div
        className={cn(
          'flex justify-between text-sm',
          isOutside ? 'text-muted-foreground' : '',
        )}
      >
        <Plus
          className={cn(
            'size-4 cursor-pointer opacity-0',
            canCreateRecord ? 'group-hover:opacity-100' : '',
          )}
          onClick={() => {}}
        />
        <p
          className={
            isToday ? 'rounder-md rounded bg-red-500 p-0.5 text-white' : ''
          }
        >
          {date.getDate()}
        </p>
      </div>
      {records.map((record) => {
        return <CalendarViewCard key={record.id} record={record} />;
      })}
    </div>
  );
};
