import React from 'react';
import { NodeCollaboratorNode } from '@/types/nodes';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface NodeCollaboratorSearchProps {
  excluded: string[];
  value: NodeCollaboratorNode[];
  onChange: (value: NodeCollaboratorNode[]) => void;
}

export const NodeCollaboratorSearch = ({
  excluded,
  value,
  onChange,
}: NodeCollaboratorSearchProps) => {
  const workspace = useWorkspace();

  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);

  const { data } = useQuery({
    type: 'node_collaborator_search',
    searchQuery: query,
    excluded: excluded,
    userId: workspace.userId,
  });

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-start p-2"
        >
          {value.map((collaborator) => (
            <Badge key={collaborator.id} variant="outline">
              {collaborator.name}
              <span
                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(value.filter((v) => v.id !== collaborator.id));
                }}
              >
                <Icon
                  name="close-line"
                  className="h-3 w-3 text-muted-foreground hover:text-foreground"
                />
              </span>
            </Badge>
          ))}
          {value.length === 0 && (
            <span className="text-xs text-muted-foreground">
              Add collaborators
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-1">
        <Command className="min-h-min" shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search collaborators..."
            className="h-9"
          />
          <CommandEmpty>No collaborator found.</CommandEmpty>
          <CommandList>
            <CommandGroup className="h-min max-h-96">
              {data?.map((collaborator) => (
                <CommandItem
                  key={collaborator.id}
                  onSelect={() => {
                    onChange([...value, collaborator]);
                    setQuery('');
                  }}
                >
                  <div className="flex w-full flex-row items-center gap-2">
                    <Avatar
                      id={collaborator.id}
                      name={collaborator.name}
                      avatar={collaborator.avatar}
                      className="h-7 w-7"
                    />
                    <div className="flex flex-grow flex-col">
                      <p className="text-sm">{collaborator.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {collaborator.email}
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
