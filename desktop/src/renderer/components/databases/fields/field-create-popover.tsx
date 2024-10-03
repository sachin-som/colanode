import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/renderer/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/renderer/components/ui/form';
import { Input } from '@/renderer/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { useDatabase } from '@/renderer/contexts/database';
import { FieldDataTypeSelect } from '@/renderer/components/databases/fields/field-type-select';
import { FieldAttrs } from '@/renderer/components/databases/fields/field-attrs';
import { Spinner } from '@/renderer/components/ui/spinner';
import { Icon } from '@/renderer/components/ui/icon';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/renderer/contexts/workspace';

const formSchema = z.object({
  name: z.string(),
  dataType: z.union([
    z.literal('autonumber'),
    z.literal('boolean'),
    z.literal('button'),
    z.literal('collaborator'),
    z.literal('created_at'),
    z.literal('created_by'),
    z.literal('date'),
    z.literal('email'),
    z.literal('file'),
    z.literal('multi_select'),
    z.literal('number'),
    z.literal('phone'),
    z.literal('select'),
    z.literal('text'),
    z.literal('updated_at'),
    z.literal('updated_by'),
    z.literal('url'),
  ]),
});

export const FieldCreatePopover = () => {
  const [open, setOpen] = React.useState(false);
  const workspace = useWorkspace();
  const database = useDatabase();

  const { mutate, isPending } = useMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      dataType: 'text',
    },
  });

  const handleCancelClick = () => {
    setOpen(false);
    form.reset();
  };

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    mutate({
      input: {
        type: 'field_create',
        databaseId: database.id,
        name: values.name,
        dataType: values.dataType,
        userId: workspace.userId,
      },
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Icon name="add-line" className="ml-2 h-3 w-3 cursor-pointer" />
      </PopoverTrigger>
      <PopoverContent className="mr-5 w-128" side="bottom">
        <Form {...form}>
          <form
            className="flex flex-col gap-2"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="flex-grow space-y-4 py-2 pb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field, formState }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input id="name" placeholder="Field name" {...field} />
                    </FormControl>
                    <FormMessage>{formState.errors.name?.message}</FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field type</FormLabel>
                    <FormControl>
                      <FieldDataTypeSelect
                        dataType={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FieldAttrs />
            </div>
            <div className="mt-2 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button variant="outline" size="sm" onClick={handleCancelClick}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending && <Spinner className="mr-1" />}
                Create
              </Button>
            </div>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  );
};
