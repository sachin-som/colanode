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
import { Avatar } from '@/renderer/components/avatars/avatar';
import { Icon } from '@/renderer/components/ui/icon';
import { generateId, IdType } from '@/lib/id';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  description: z.string(),
  avatar: z.string().optional(),
});

type formSchemaType = z.infer<typeof formSchema>;

interface WorkspaceFormProps {
  values?: formSchemaType;
  onSubmit: (values: formSchemaType) => void;
  isSaving: boolean;
  onCancel?: () => void;
  saveText: string;
}

export const WorkspaceForm = ({
  values,
  onSubmit,
  isSaving,
  onCancel,
  saveText,
}: WorkspaceFormProps) => {
  const account = useAccount();

  const id = React.useRef(generateId(IdType.Workspace));
  const [isFileDialogOpen, setIsFileDialogOpen] = React.useState(false);
  const { mutate, isPending } = useMutation();

  const form = useForm<formSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: values?.name ?? '',
      description: values?.description ?? '',
      avatar: values?.avatar,
    },
  });

  const name = form.watch('name');
  const avatar = form.watch('avatar');

  return (
    <Form {...form}>
      <form className="flex flex-col" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-row gap-1">
          <div className="h-40 w-40 pt-3">
            <div
              className="group relative cursor-pointer"
              onClick={async () => {
                if (isPending || isFileDialogOpen) {
                  return;
                }

                setIsFileDialogOpen(true);
                const result = await window.neuron.openFileDialog({
                  properties: ['openFile'],
                  filters: [
                    { name: 'Images', extensions: ['jpg', 'png', 'jpeg'] },
                  ],
                });

                if (result.canceled || !result.filePaths.length) {
                  setIsFileDialogOpen(false);
                  return;
                }

                const filePath = result.filePaths[0];
                mutate({
                  input: {
                    type: 'avatar_upload',
                    accountId: account.id,
                    filePath: filePath,
                  },
                  onSuccess(output) {
                    if (output.status === 'success' && output.id) {
                      form.setValue('avatar', output.id);
                    }
                    setIsFileDialogOpen(false);
                  },
                  onError() {
                    toast({
                      title: 'Failed to upload avatar',
                      description:
                        'Something went wrong trying to upload avatar. Please try again.',
                      variant: 'destructive',
                    });
                    setIsFileDialogOpen(false);
                  },
                });
              }}
            >
              <Avatar
                id={id.current}
                name={name.length > 0 ? name : 'New workspace'}
                avatar={avatar}
                className="h-32 w-32"
              />
              <div
                className={cn(
                  `absolute left-0 top-0 hidden h-32 w-32 items-center justify-center overflow-hidden bg-gray-50 group-hover:inline-flex`,
                  isPending ? 'inline-flex' : 'hidden',
                )}
              >
                {isPending ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  <Icon
                    name="upload-2-line"
                    className="h-5 w-6 text-foreground"
                  />
                )}
              </div>
            </div>
          </div>
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
        </div>

        <div className="flex flex-row justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              disabled={isPending || isSaving}
              variant="outline"
              onClick={() => {
                onCancel();
              }}
            >
              Cancel
            </Button>
          )}

          <Button type="submit" disabled={isPending || isSaving}>
            {isSaving && <Spinner className="mr-1" />}
            {saveText}
          </Button>
        </div>
      </form>
    </Form>
  );
};
