import React from 'react';
import { cn, isSameDay } from '@/lib/utils';
import { RecordNode } from '@/types/databases';
import { Icon } from '@/components/ui/icon';
import { CalendarViewCard } from '@/components/databases/calendars/calendar-view-card';

interface CalendarViewDayProps {
  date: Date;
  month: Date;
  outside: boolean;
  records: RecordNode[];
}

export const CalendarViewDay = ({
  date,
  month,
  outside,
  records,
}: CalendarViewDayProps) => {
  const isToday = isSameDay(date, new Date());
  const canCreateRecord = false;

  return (
    <td
      className={cn(
        'relative h-40 flex-1 p-2 text-right text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent',
        '[&:has([aria-selected])]:rounded-md',
        'overflow-auto border-r border-gray-100 first:border-l',
        'group flex flex-col gap-1',
      )}
    >
      <div
        className={cn(
          'flex justify-between text-sm',
          outside ? 'text-muted-foreground' : '',
        )}
      >
        <Icon
          name="add-line"
          className={cn(
            'cursor-pointer opacity-0',
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
    </td>
  );
};
