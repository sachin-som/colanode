import React from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn, getDisplayedDates } from '@/lib/utils';
import { DayPicker, DayProps } from 'react-day-picker';
import { CalendarViewDay } from '@/components/databases/calendars/calendar-view-day';
import { CalendarViewNode, FieldNode, ViewFilterNode } from '@/types/databases';
import { useRecordsQuery } from '@/queries/use-records-query';
import { useDatabase } from '@/contexts/database';
import { filterRecords } from '@/lib/databases';
import { useWorkspace } from '@/contexts/workspace';

interface CalendarViewGridProps {
  view: CalendarViewNode;
  field: FieldNode;
}

export const CalendarViewGrid = ({ view, field }: CalendarViewGridProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  const [month, setMonth] = React.useState(new Date());
  const { first, last } = getDisplayedDates(month);

  const filters = [
    ...view.filters,
    {
      id: 'start_date',
      fieldId: field.id,
      operator: 'is_on_or_after',
      values: [
        {
          textValue: first.toISOString(),
          numberValue: null,
          foreignNodeId: null,
        },
      ],
    },
    {
      id: 'end_date',
      fieldId: field.id,
      operator: 'is_on_or_before',
      values: [
        {
          textValue: last.toISOString(),
          numberValue: null,
          foreignNodeId: null,
        },
      ],
    },
  ];

  const { data, isPending, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useRecordsQuery(database.id, filters, view.sorts);

  if (isPending) {
    return null;
  }

  const records = data ?? [];
  return (
    <DayPicker
      showOutsideDays
      className="p-3"
      month={month}
      onMonthChange={(month) => {
        setMonth(month);
      }}
      classNames={{
        months:
          'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full',
        month: 'space-y-4 w-full',
        month_caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
          'absolute left-1',
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
          'absolute right-1',
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex flex-row mb-2',
        weekday:
          'text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem]',
        week: 'flex flex-row w-full border-b first:border-t',
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === 'left') {
            return (
              <Icon name="arrow-left-s-line" className="h-4 w-4" {...props} />
            );
          }
          return (
            <Icon name="arrow-right-s-line" className="h-4 w-4" {...props} />
          );
        },
        Day: (props: DayProps) => {
          const filter: ViewFilterNode = {
            id: 'calendar_filter',
            fieldId: field.id,
            operator: 'is_equal_to',
            values: [
              {
                textValue: props.day.date.toISOString(),
                numberValue: null,
                foreignNodeId: null,
              },
            ],
          };

          const dayRecords = filterRecords(
            records,
            filter,
            field,
            workspace.userId,
          );

          return (
            <CalendarViewDay
              date={props.day.date}
              month={props.day.displayMonth}
              outside={props.day.outside}
              records={dayRecords}
            />
          );
        },
      }}
    />
  );
};
