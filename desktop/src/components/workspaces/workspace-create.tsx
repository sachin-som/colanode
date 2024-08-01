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
import {parseApiError} from "@/lib/axios";
import {Workspace} from "@/types/workspaces";
import {useAxios} from "@/contexts/axios";
import {useStore} from "@/contexts/store";
import {observer} from "mobx-react-lite";

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  description: z.string(),
});

export const WorkspaceCreate = observer(() => {
  const store = useStore();
  const axios = useAxios();

  const [isPending, setIsPending] = React.useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true);
    try {
      const { data } = await axios.post<Workspace>('v1/workspaces', values);
      if (data) {
        store.addWorkspace(data);
        await window.globalDb.addWorkspace(data);
      } else {
        toast({
          title: 'Failed to create workspace',
          description: 'Invalid response from server',
          variant: 'destructive',
        });
      }
    } catch (error) {
      const apiError = parseApiError(error);
      toast({
        title: 'Failed to create workspace',
        description: apiError.message,
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  }

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
                render={({field}) => (
                  <FormItem className="flex-1">
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write a short description about the workspace"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-row justify-end gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner className="mr-1"/>}
                Create
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
});