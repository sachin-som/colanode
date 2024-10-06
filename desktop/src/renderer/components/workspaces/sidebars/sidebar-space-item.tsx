import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { Icon } from '@/renderer/components/ui/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { getDefaultNodeIcon } from '@/lib/nodes';
import { NodeTypes } from '@/lib/constants';
import { ChannelCreateDialog } from '@/renderer/components/channels/channel-create-dialog';
import { PageCreateDialog } from '@/renderer/components/pages/page-create-dialog';
import { DatabaseCreateDialog } from '@/renderer/components/databases/database-create-dialog';
import { SidebarSpaceNode } from '@/types/workspaces';
import { SidebarItem } from '@/renderer/components/workspaces/sidebars/sidebar-item';

interface SettingsState {
  open: boolean;
  tab?: string;
}

interface SidebarSpaceNodeProps {
  node: SidebarSpaceNode;
}

export const SidebarSpaceItem = ({ node }: SidebarSpaceNodeProps) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const [openCreatePage, setOpenCreatePage] = React.useState(false);
  const [openCreateChannel, setOpenCreateChannel] = React.useState(false);
  const [openCreateDatabase, setOpenCreateDatabase] = React.useState(false);
  const [openCreateFolder, setOpenCreateFolder] = React.useState(false);
  const [settingsState, setSettingsState] = React.useState<SettingsState>({
    open: false,
  });

  const isActive = false;

  return (
    <React.Fragment>
      <div
        key={node.id}
        className={cn(
          'group/sidebar-node flex cursor-pointer items-center rounded-md p-1 text-sm text-foreground/80 hover:bg-gray-100',
          isActive && 'bg-gray-100',
        )}
      >
        <Avatar
          id={node.id}
          avatar={node.avatar}
          name={node.name}
          size="small"
        />
        <span
          className="line-clamp-1 w-full flex-grow pl-2 text-left"
          onClick={() => setIsOpen(!isOpen)}
        >
          {node.name ?? 'Unnamed'}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <span className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-md p-1 opacity-0 hover:bg-gray-200 hover:text-primary group-hover/sidebar-node:opacity-100">
              <Icon name="more-line" />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="ml-1 w-72">
            <DropdownMenuLabel>{node.name ?? 'Unnamed'}</DropdownMenuLabel>
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
          {node.children.map((child) => (
            <SidebarItem key={child.id} node={child} />
          ))}
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
      {openCreateDatabase && (
        <DatabaseCreateDialog
          spaceId={node.id}
          open={openCreateDatabase}
          onOpenChange={setOpenCreateDatabase}
        />
      )}
    </React.Fragment>
  );
};
