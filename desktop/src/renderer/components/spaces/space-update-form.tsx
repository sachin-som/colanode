import React from 'react';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/renderer/components/ui/form';
import { Input } from '@/renderer/components/ui/input';
import { Spinner } from '@/renderer/components/ui/spinner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';
import { AvatarPopover } from '@/renderer/components/avatars/avatar-popover';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { Textarea } from '@/renderer/components/ui/textarea';
import { Button } from '@/renderer/components/ui/button';

interface SpaceUpdateFormProps {
  id: string;
}

const formSchema = z.object({
  name: z.string(),
  description: z.string(),
  avatar: z.string(),
});

export const SpaceUpdateForm = ({ id }: SpaceUpdateFormProps) => {
  const workspace = useWorkspace();
  const canEdit = true;
  const { data, isPending: isLoadingSpace } = useQuery({
    type: 'node_get',
    nodeId: id,
    userId: workspace.userId,
  });

  const { mutate: updateSpace, isPending: isUpdatingSpace } = useMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      avatar: null,
    },
  });

  React.useEffect(() => {
    if (data) {
      form.reset({
        name: data.attributes.name,
        description: data.attributes.description,
        avatar: data.attributes.avatar,
      });
    }
  }, [isLoadingSpace, data]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (!data?.id) return;

    updateSpace({
      input: {
        type: 'space_update',
        userId: workspace.userId,
        id: data.id,
        name: values.name,
        description: values.description,
        avatar: values.avatar,
      },
      onSuccess() {
        toast({
          title: 'Space updated',
          description: 'Space was updated successfully',
          variant: 'default',
        });
      },
      onError() {
        toast({
          title: 'Failed to update space',
          description: 'Something went wrong updating space. Please try again!',
          variant: 'destructive',
        });
      },
    });
  };

  if (isLoadingSpace) {
    return <Spinner />;
  }

  const name = form.watch('name');
  const avatar = form.watch('avatar');

  return (
    <Form {...form}>
      <form
        className="flex flex-col"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <div className="space-y-4 pb-4">
          <div className="flex flex-row items-end gap-4">
            <AvatarPopover onPick={(avatar) => form.setValue('avatar', avatar)}>
              <Button variant="outline" size="icon">
                <Avatar
                  id={id}
                  name={name}
                  avatar={avatar}
                  className="h-6 w-6"
                />
              </Button>
            </AvatarPopover>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} disabled={!canEdit} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write a short description about the network"
                    {...field}
                    disabled={!canEdit}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {canEdit && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isUpdatingSpace}>
              {isUpdatingSpace && <Spinner className="mr-1" />}
              Update
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};
