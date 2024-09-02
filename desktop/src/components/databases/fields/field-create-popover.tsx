import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDatabase } from '@/contexts/database';
import { FieldTypeSelect } from './field-type-select';
import { FieldAttrs } from './field-attrs';
import { useMutation } from '@tanstack/react-query';
import { useWorkspace } from '@/contexts/workspace';
import { compareString } from '@/lib/utils';
import { generateNodeIndex } from '@/lib/nodes';
import { NeuronId } from '@/lib/id';
import { NodeTypes } from '@/lib/constants';
import { Spinner } from '@/components/ui/spinner';
import { Icon } from '@/components/ui/icon';

const formSchema = z.object({
  name: z.string(),
  type: z.union([
    z.literal('autonumber'),
    z.literal('boolean'),
    z.literal('button'),
    z.literal('collaborator'),
    z.literal('created_at'),
    z.literal('created_by'),
    z.literal('date'),
    z.literal('email'),
    z.literal('file'),
    z.literal('formula'),
    z.literal('multi_select'),
    z.literal('number'),
    z.literal('phone'),
    z.literal('relation'),
    z.literal('rollup'),
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'text',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const siblingsQuery = workspace.schema
        .selectFrom('nodes')
        .where('parent_id', '=', database.id)
        .selectAll()
        .compile();

      const result = await workspace.query(siblingsQuery);
      const siblings = result.rows;
      const maxIndex =
        siblings.length > 0
          ? siblings.sort((a, b) => compareString(a.index, b.index))[
              siblings.length - 1
            ].index
          : null;

      const index = generateNodeIndex(maxIndex, null);
      const query = workspace.schema
        .insertInto('nodes')
        .values({
          id: NeuronId.generate(NeuronId.Type.Field),
          type: NodeTypes.Field,
          parent_id: database.id,
          index,
          attrs: JSON.stringify({
            name: values.name,
            type: values.type,
          }),
          content: null,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .compile();

      await workspace.mutate(query);
    },
  });

  const handleCancelClick = () => {
    setOpen(false);
    form.reset();
  };

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    mutate(values, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Icon name="add-line" className="mr-2 h-3 w-3 cursor-pointer" />
      </PopoverTrigger>
      <PopoverContent className="w-128 mr-5" side="bottom">
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field type</FormLabel>
                    <FormControl>
                      <FieldTypeSelect
                        type={field.value}
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
