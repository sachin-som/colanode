import { SquarePen } from 'lucide-react';
import React from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { UserSearch } from '@/renderer/components/users/user-search';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';
import { useLayout } from '@/renderer/contexts/layout';

export const ChatCreatePopover = () => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();
  const layout = useLayout();

  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <SquarePen className="size-4 cursor-pointer" />
      </PopoverTrigger>
      <PopoverContent className="w-96 p-1">
        <UserSearch
          onSelect={(user) => {
            if (isPending) return;

            mutate({
              input: {
                type: 'chat_create',
                accountId: workspace.accountId,
                workspaceId: workspace.id,
                userId: user.id,
              },
              onSuccess(output) {
                layout.openLeft(output.id);
                setOpen(false);
              },
              onError(error) {
                toast({
                  title: 'Failed to create chat',
                  description: error.message,
                  variant: 'destructive',
                });
              },
            });
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
