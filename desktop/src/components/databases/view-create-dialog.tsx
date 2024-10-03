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
import { useDatabase } from '@/contexts/database';
import { FieldSelect } from '@/components/databases/fields/field-select';
import { toast } from '@/components/ui/use-toast';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/contexts/workspace';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  type: z.enum(['TABLE', 'BOARD', 'CALENDAR']),
  groupBy: z.string().optional(),
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
  const workspace = useWorkspace();
  const database = useDatabase();
  const { mutate, isPending } = useMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'TABLE',
    },
  });
  const type = form.watch('type');

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isPending) {
      return;
    }

    if (values.type === 'TABLE') {
      mutate({
        input: {
          type: 'table_view_create',
          databaseId: database.id,
          name: values.name,
          userId: workspace.userId,
        },
        onSuccess() {
          form.reset();
          onOpenChange(false);
        },
      });
    } else if (values.type === 'BOARD') {
      if (!values.groupBy) {
        toast({
          title: 'Failed to create board view',
          description:
            'You need to specify a group by field to create a board view',
          variant: 'destructive',
        });
        return;
      }

      mutate({
        input: {
          type: 'board_view_create',
          databaseId: database.id,
          name: values.name,
          groupBy: values.groupBy,
          userId: workspace.userId,
        },
        onSuccess() {
          form.reset();
          onOpenChange(false);
        },
      });
    } else if (values.type === 'CALENDAR') {
      if (!values.groupBy) {
        toast({
          title: 'Failed to create calendar view',
          description:
            'You need to specify a group by field to create a calendar view',
          variant: 'destructive',
        });
        return;
      }

      mutate({
        input: {
          type: 'calendar_view_create',
          databaseId: database.id,
          name: values.name,
          groupBy: values.groupBy,
          userId: workspace.userId,
        },
        onSuccess() {
          form.reset();
          onOpenChange(false);
        },
      });
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
              {type === 'BOARD' && (
                <FormField
                  control={form.control}
                  name="groupBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group by</FormLabel>
                      <FormControl>
                        <FieldSelect
                          fields={database.fields.filter(
                            (field) => field.dataType === 'select',
                          )}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {type === 'CALENDAR' && (
                <FormField
                  control={form.control}
                  name="groupBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group by</FormLabel>
                      <FormControl>
                        <FieldSelect
                          fields={database.fields.filter(
                            (field) =>
                              field.dataType === 'date' ||
                              field.dataType === 'created_at',
                          )}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
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
