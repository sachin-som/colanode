export type CalendarViewCreateMutationInput = {
  type: 'calendar_view_create';
  userId: string;
  databaseId: string;
  name: string;
  groupBy: string;
};

export type CalendarViewCreateMutationOutput = {
  id: string;
};

declare module '@/types/mutations' {
  interface MutationMap {
    calendar_view_create: {
      input: CalendarViewCreateMutationInput;
      output: CalendarViewCreateMutationOutput;
    };
  }
}
