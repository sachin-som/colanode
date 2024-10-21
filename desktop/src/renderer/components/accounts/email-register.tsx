import React from 'react';
import { Input } from '@/renderer/components/ui/input';
import { Button } from '@/renderer/components/ui/button';
import { Spinner } from '@/renderer/components/ui/spinner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/renderer/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/renderer/hooks/use-toast';
import { Icon } from '@/renderer/components/ui/icon';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { Server } from '@/types/servers';

const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().min(2).email(),
  password: z.string().min(8),
});

interface EmailRegisterProps {
  server: Server;
}

export const EmailRegister = ({ server }: EmailRegisterProps) => {
  const { mutate, isPending } = useMutation();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    mutate({
      input: {
        type: 'email_register',
        name: values.name,
        email: values.email,
        password: values.password,
        server: server.domain,
      },
      onSuccess() {
        window.location.href = '/';
      },
      onError() {
        toast({
          title: 'Failed to register',
          description:
            'Something went wrong trying to register. Please try again.',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="password" placeholder="Password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? (
            <Spinner className="mr-2 h-4 w-4" />
          ) : (
            <Icon name="mail-line" className="mr-2 h-4 w-4" />
          )}
          Register
        </Button>
      </form>
    </Form>
  );
};
