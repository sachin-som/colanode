import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { BreadcrumbNode } from '@/types/workspaces';
import { SmartTextInput } from '@/renderer/components/ui/smart-text-input';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { AvatarPopover } from '@/renderer/components/avatars/avatar-popover';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { Button } from '@/renderer/components/ui/button';

interface BreadcrumbItemPopoverProps {
  node: BreadcrumbNode;
  children: React.ReactNode;
}

export const BreadcrumbItemPopover = ({
  node,
  children,
}: BreadcrumbItemPopoverProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  return (
    <Popover>
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent className="w-96 p-3">
        <div className="flex flex-row items-center gap-3">
          <AvatarPopover
            onPick={(avatar) => {
              if (isPending) return;
              mutate({
                input: {
                  type: 'node_attribute_set',
                  nodeId: node.id,
                  attribute: 'avatar',
                  value: avatar,
                  userId: workspace.userId,
                },
              });
            }}
          >
            <Button type="button" variant="outline" size="icon">
              <Avatar
                size="small"
                id={node.id}
                name={node.name}
                avatar={node.avatar}
              />
            </Button>
          </AvatarPopover>
          <SmartTextInput
            value={node.name}
            placeholder="Unnamed"
            onChange={(newName) => {
              if (isPending) return;
              if (newName === node.name) return;

              mutate({
                input: {
                  type: 'node_attribute_set',
                  nodeId: node.id,
                  attribute: 'name',
                  value: newName,
                  userId: workspace.userId,
                },
              });
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
