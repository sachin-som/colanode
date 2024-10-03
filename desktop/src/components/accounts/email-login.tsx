import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/ui/use-toast';
import { Icon } from '@/components/ui/icon';
import { Server } from '@/types/servers';
import { useMutation } from '@/renderer/hooks/use-mutation';

const formSchema = z.object({
  email: z.string().min(2).email(),
  password: z.string().min(8),
});

interface EmailLoginProps {
  server: Server;
}

export const EmailLogin = ({ server }: EmailLoginProps) => {
  const { mutate, isPending } = useMutation();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    mutate({
      input: {
        type: 'email_login',
        email: values.email,
        password: values.password,
        server: server.domain,
      },
      onSuccess() {
        window.location.href = '/';
      },
      onError() {
        toast({
          title: 'Failed to login',
          description:
            'Something went wrong trying to login. Please try again.',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
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
          Login
        </Button>
      </form>
    </Form>
  );
};
