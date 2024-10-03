import React from 'react';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from '@/renderer/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/renderer/components/ui/button';
import { Spinner } from '@/renderer/components/ui/spinner';
import { Input } from '@/renderer/components/ui/input';
import { Textarea } from '@/renderer/components/ui/textarea';
import { toast } from '@/renderer/components/ui/use-toast';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useAccount } from '@/renderer/contexts/account';
import { useNavigate } from 'react-router-dom';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  description: z.string(),
});

type formSchemaType = z.infer<typeof formSchema>;

export const WorkspaceCreate = () => {
  const account = useAccount();
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation();
  const form = useForm<formSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const handleSubmit = async (values: formSchemaType) => {
    mutate({
      input: {
        type: 'workspace_create',
        name: values.name,
        description: values.description,
        accountId: account.id,
      },
      onSuccess() {
        window.location.href = '/';
      },
      onError() {
        toast({
          title: 'Failed to create workspace',
          description:
            'Somewthing went wrong creating the workspace. Please try again!',
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
              {account.workspaces?.length > 0 && (
                <Button
                  type="button"
                  disabled={isPending}
                  variant="outline"
                  onClick={() => {
                    navigate('/');
                  }}
                >
                  Cancel
                </Button>
              )}

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
};
