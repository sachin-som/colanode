import React from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn, getDisplayedDates, toUTCDate } from '@/lib/utils';
import { DayPicker, DayProps } from 'react-day-picker';
import { CalendarViewDay } from '@/components/databases/calendars/calendar-view-day';
import { CalendarViewNode, FieldNode, ViewFilter } from '@/types/databases';
import { useInfiniteQuery } from '@/renderer/hooks/use-infinite-query';
import { useDatabase } from '@/contexts/database';
import { filterRecords } from '@/lib/databases';
import { useWorkspace } from '@/contexts/workspace';

const RECORDS_PER_PAGE = 50;

interface CalendarViewGridProps {
  view: CalendarViewNode;
  field: FieldNode;
}

export const CalendarViewGrid = ({ view, field }: CalendarViewGridProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  const [month, setMonth] = React.useState(new Date());
  const { first, last } = getDisplayedDates(month);

  const filters: ViewFilter[] = [
    ...view.filters,
    {
      id: 'start_date',
      type: 'field',
      fieldId: field.id,
      operator: 'is_on_or_after',
      value: first.toISOString(),
    },
    {
      id: 'end_date',
      type: 'field',
      fieldId: field.id,
      operator: 'is_on_or_before',
      value: last.toISOString(),
    },
  ];

  const { data, isPending, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      initialPageInput: {
        type: 'record_list',
        databaseId: database.id,
        filters: filters,
        sorts: view.sorts,
        page: 0,
        count: RECORDS_PER_PAGE,
        userId: workspace.userId,
      },
      getNextPageInput(page, pages) {
        if (page > pages.length) {
          return undefined;
        }

        const lastPage = pages[page - 1];
        if (lastPage.length < RECORDS_PER_PAGE) {
          return undefined;
        }

        return {
          type: 'record_list',
          databaseId: database.id,
          filters: filters,
          sorts: view.sorts,
          page: page,
          count: RECORDS_PER_PAGE,
          userId: workspace.userId,
        };
      },
    });

  if (isPending) {
    return null;
  }

  const records = data?.flatMap((page) => page) ?? [];
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
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex flex-row mb-2',
        head_cell:
          'text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem]',
        row: 'flex flex-row w-full border-b first:border-t',
        cell: cn(
          'relative flex-1 h-40 p-2 text-right text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent',
          '[&:has([aria-selected])]:rounded-md',
          'border-r first:border-l border-gray-100 overflow-auto',
        ),
      }}
      components={{
        IconLeft: ({ ...props }) => (
          <Icon name="arrow-left-s-line" className="h-4 w-4" {...props} />
        ),
        IconRight: ({ ...props }) => (
          <Icon name="arrow-right-s-line" className="h-4 w-4" {...props} />
        ),
        Day: (props: DayProps) => {
          const filter: ViewFilter = {
            id: 'calendar_filter',
            type: 'field',
            fieldId: field.id,
            operator: 'is_equal_to',
            value: props.date.toISOString(),
          };

          const dayRecords = filterRecords(
            records,
            filter,
            field,
            workspace.userId,
          );

          return (
            <CalendarViewDay
              date={toUTCDate(props.date)}
              month={props.displayMonth}
              records={dayRecords}
            />
          );
        },
      }}
    />
  );
};
