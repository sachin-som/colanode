import React from 'react';
import { Icon } from '@/components/ui/icon';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Avatar } from '@/components/ui/avatar';
import { useUserSearchQuery } from '@/queries/use-user-search-query';
import { useChatCreateMutation } from '@/mutations/use-chat-create-mutation';
import { useWorkspace } from '@/contexts/workspace';

export const ChatCreatePopover = () => {
  const workspace = useWorkspace();

  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const { data } = useUserSearchQuery(query);
  const { mutate } = useChatCreateMutation();

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Icon name="add-line" className="mr-2 h-3 w-3 cursor-pointer" />
      </PopoverTrigger>
      <PopoverContent className="w-96 p-1">
        <Command className="min-h-min" shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search users..."
            className="h-9"
          />
          <CommandEmpty>No user found.</CommandEmpty>
          <CommandList>
            <CommandGroup className="h-min max-h-96">
              {data?.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => {
                    mutate(
                      {
                        userId: user.id,
                      },
                      {
                        onSuccess: (id) => {
                          workspace.navigateToNode(id);
                        },
                      },
                    );
                    setQuery('');
                  }}
                >
                  <div className="flex w-full flex-row items-center gap-2">
                    <Avatar
                      id={user.id}
                      name={user.name}
                      avatar={user.avatar}
                      className="h-7 w-7"
                    />
                    <div className="flex flex-grow flex-col">
                      <p className="text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
