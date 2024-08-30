import React from 'react';
import { LocalNode } from '@/types/nodes';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { SidebarNodeChildren } from '@/components/workspaces/sidebar-node-children';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getDefaultNodeIcon } from '@/lib/nodes';
import { NodeTypes } from '@/lib/constants';
import { ChannelCreateDialog } from '@/components/channels/channel-create-dialog';
import { PageCreateDialog } from '@/components/pages/page-create-dialog';

interface SettingsState {
  open: boolean;
  tab?: string;
}

interface SpaceSidebarNodeProps {
  node: LocalNode;
}

export const SpaceSidebarNode = ({ node }: SpaceSidebarNodeProps) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const [openCreatePage, setOpenCreatePage] = React.useState(false);
  const [openCreateChannel, setOpenCreateChannel] = React.useState(false);
  const [openCreateDatabase, setOpenCreateDatabase] = React.useState(false);
  const [openCreateFolder, setOpenCreateFolder] = React.useState(false);
  const [settingsState, setSettingsState] = React.useState<SettingsState>({
    open: false,
  });

  const isActive = false;
  const avatar = node.attrs.avatar;
  const name = node.attrs.name ?? 'Unnamed';
  return (
    <React.Fragment>
      <div
        key={node.id}
        className={cn(
          'group/sidebar-node flex cursor-pointer items-center rounded-md p-1 text-sm text-foreground/80 hover:bg-gray-100',
          isActive && 'bg-gray-100',
        )}
      >
        <Avatar id={node.id} avatar={avatar} name={name} size="small" />
        <span
          className="line-clamp-1 w-full flex-grow pl-2 text-left"
          onClick={() => setIsOpen(!isOpen)}
        >
          {name}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <span className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-md p-1 opacity-0 hover:bg-gray-200 hover:text-primary group-hover/sidebar-node:opacity-100">
              <Icon name="more-line" />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="ml-1 w-72">
            <DropdownMenuLabel>{name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setOpenCreatePage(true)}>
              <div className="flex flex-row items-center gap-2">
                <Icon name={getDefaultNodeIcon(NodeTypes.Page)} />
                <span>Add page</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setOpenCreateChannel(true)}>
              <div className="flex flex-row items-center gap-2">
                <Icon name={getDefaultNodeIcon(NodeTypes.Channel)} />
                <span>Add channel</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setOpenCreateDatabase(true)}>
              <div className="flex flex-row items-center gap-2">
                <Icon name={getDefaultNodeIcon(NodeTypes.Database)} />
                <span>Add database</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setOpenCreateFolder(true)}>
              <div className="flex flex-row items-center gap-2">
                <Icon name={getDefaultNodeIcon(NodeTypes.Folder)} />
                <span>Add folder</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSettingsState({ open: true })}>
              <div className="flex flex-row items-center gap-2">
                <Icon name="settings-3-line" />
                <span>Settings</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                setSettingsState({
                  open: true,
                  tab: 'collaborators',
                })
              }
            >
              <div className="flex flex-row items-center gap-2">
                <Icon name="user-add-line" />
                <span>Add collaborators</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isOpen && (
        <div className="pl-4">
          <SidebarNodeChildren node={node} />
        </div>
      )}
      {openCreateChannel && (
        <ChannelCreateDialog
          spaceId={node.id}
          open={openCreateChannel}
          onOpenChange={setOpenCreateChannel}
        />
      )}
      {openCreatePage && (
        <PageCreateDialog
          spaceId={node.id}
          open={openCreatePage}
          onOpenChange={setOpenCreatePage}
        />
      )}
    </React.Fragment>
  );
};
