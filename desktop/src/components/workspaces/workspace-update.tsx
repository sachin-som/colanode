import React from 'react';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { parseApiError } from '@/lib/axios';
import { useWorkspaceUpdateMutation } from '@/mutations/use-workspace-update-mutation';
import { useWorkspace } from '@/contexts/workspace';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  description: z.string(),
});

type formSchemaType = z.infer<typeof formSchema>;

export const WorkspaceUpdate = () => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useWorkspaceUpdateMutation();

  const form = useForm<formSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: workspace.name,
      description: workspace.description,
    },
  });

  const handleSubmit = async (values: formSchemaType) => {
    mutate(
      {
        id: workspace.id,
        name: values.name,
        description: values.description,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Workspace updated',
            description: 'Workspace was updated successfully',
            variant: 'default',
          });
        },
        onError: (error) => {
          const apiError = parseApiError(error);
          toast({
            title: 'Failed to update workspace',
            description: apiError.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  return (
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write a short description about the workspace"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-row justify-end gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner className="mr-1" />}
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
};
