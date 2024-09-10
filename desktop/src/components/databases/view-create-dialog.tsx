import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { useTableViewCreateMutation } from '@/mutations/use-table-view-create-mutation';
import { useBoardViewCreateMutation } from '@/mutations/use-board-view-create-mutation';
import { useCalendarViewCreateMutation } from '@/mutations/use-calendar-view-create-mutation';
import { useDatabase } from '@/contexts/database';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  type: z.enum(['TABLE', 'BOARD', 'CALENDAR']),
});

interface ViewTypeOption {
  name: string;
  icon: string;
  type: 'TABLE' | 'BOARD' | 'CALENDAR';
}

const viewTypes: ViewTypeOption[] = [
  {
    name: 'Table',
    icon: 'table-2',
    type: 'TABLE',
  },
  {
    name: 'Board',
    icon: 'layout-column-line',
    type: 'BOARD',
  },
  {
    name: 'Calendar',
    icon: 'calendar-2-line',
    type: 'CALENDAR',
  },
];

interface ViewCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewCreateDialog = ({
  open,
  onOpenChange,
}: ViewCreateDialogProps) => {
  const database = useDatabase();
  const tableViewCreateMutation = useTableViewCreateMutation();
  const boardViewCreateMutation = useBoardViewCreateMutation();
  const calendarViewCreateMutation = useCalendarViewCreateMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'TABLE',
    },
  });

  const isPending =
    tableViewCreateMutation.isPending ||
    boardViewCreateMutation.isPending ||
    calendarViewCreateMutation.isPending;

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isPending) {
      return;
    }

    if (values.type === 'TABLE') {
      tableViewCreateMutation.mutate(
        {
          databaseId: database.id,
          name: values.name,
        },
        {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
        },
      );
    } else if (values.type === 'BOARD') {
      boardViewCreateMutation.mutate(
        {
          databaseId: database.id,
          name: values.name,
        },
        {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
        },
      );
    } else if (values.type === 'CALENDAR') {
      calendarViewCreateMutation.mutate(
        {
          databaseId: database.id,
          name: values.name,
        },
        {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
        },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create view</DialogTitle>
          <DialogDescription>
            Create a new view to display your database records
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="flex-grow space-y-4 py-2 pb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-4">
                    {viewTypes.map((viewType) => (
                      <div
                        role="presentation"
                        key={viewType.name}
                        className={cn(
                          'flex cursor-pointer flex-col items-center gap-2 rounded-md border p-3 text-muted-foreground',
                          'hover:border-gray-500 hover:bg-gray-50',
                          viewType.type === field.value
                            ? 'border-gray-500 text-primary'
                            : '',
                        )}
                        onClick={() => field.onChange(viewType.type)}
                      >
                        <Icon name={viewType.icon} />
                        <p>{viewType.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner className="mr-1" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
