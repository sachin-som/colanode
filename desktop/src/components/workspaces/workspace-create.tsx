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
import { observer } from 'mobx-react-lite';
import { useMutation } from '@tanstack/react-query';
import { Workspace } from '@/types/workspaces';
import { useAppDatabase } from '@/contexts/app-database';
import { useAxios } from '@/contexts/axios';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  description: z.string(),
});

type formSchemaType = z.infer<typeof formSchema>;

export const WorkspaceCreate = observer(() => {
  const appDatabase = useAppDatabase();
  const axios = useAxios();
  const { mutate, isPending } = useMutation({
    mutationFn: async (input: formSchemaType) => {
      const { data } = await axios.post<Workspace>('v1/workspaces', input);
      return data;
    },
  });

  const form = useForm<formSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const handleSubmit = async (values: formSchemaType) => {
    mutate(values, {
      onSuccess: async (data) => {
        const insertWorkspaceQuery = appDatabase.database
          .insertInto('workspaces')
          .values({
            id: data.id,
            account_id: data.accountId,
            name: data.name,
            description: data.description,
            avatar: data.avatar,
            role: data.role,
            synced: 0,
            user_id: data.userId,
            version_id: data.versionId,
          })
          .compile();

        await appDatabase.mutate(insertWorkspaceQuery);

        window.location.href = '/';
      },
      onError: (error) => {
        const apiError = parseApiError(error);
        toast({
          title: 'Failed to create workspace',
          description: apiError.message,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <div className="container flex flex-row justify-center">
      <div className="w-full max-w-[700px]">
        <div className="flex flex-row justify-center py-8">
          <h1 className="text-center text-4xl font-bold leading-tight tracking-tighter lg:leading-[1.1]">
            Setup your workspace
          </h1>
        </div>
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
                Create
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
});
