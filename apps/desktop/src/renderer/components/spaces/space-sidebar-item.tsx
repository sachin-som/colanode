import { compareString, SpaceEntry } from '@colanode/core';
import {
  ChevronRight,
  Database,
  Ellipsis,
  Folder,
  MessageCircle,
  Plus,
  Settings,
  StickyNote,
} from 'lucide-react';
import React from 'react';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { ChannelCreateDialog } from '@/renderer/components/channels/channel-create-dialog';
import { DatabaseCreateDialog } from '@/renderer/components/databases/database-create-dialog';
import { FolderCreateDialog } from '@/renderer/components/folders/folder-create-dialog';
import { EntrySidebarItem } from '@/renderer/components/layouts/entry-sidebar-item';
import { PageCreateDialog } from '@/renderer/components/pages/page-create-dialog';
import { SpaceSettingsDialog } from '@/renderer/components/spaces/space-settings-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/renderer/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { cn } from '@/shared/lib/utils';

interface SettingsState {
  open: boolean;
  tab?: string;
}

interface SpaceSidebarItemProps {
  space: SpaceEntry;
}

export const SpaceSidebarItem = ({ space }: SpaceSidebarItemProps) => {
  const workspace = useWorkspace();

  const { data } = useQuery({
    type: 'entry_children_get',
    entryId: space.id,
    userId: workspace.userId,
    types: ['page', 'channel', 'database', 'folder'],
  });

  const children = (data ?? []).toSorted((a, b) => compareString(a.id, b.id));

  const [openCreatePage, setOpenCreatePage] = React.useState(false);
  const [openCreateChannel, setOpenCreateChannel] = React.useState(false);
  const [openCreateDatabase, setOpenCreateDatabase] = React.useState(false);
  const [openCreateFolder, setOpenCreateFolder] = React.useState(false);
  const [settingsState, setSettingsState] = React.useState<SettingsState>({
    open: false,
  });

  return (
    <React.Fragment>
      <Collapsible
        key={space.id}
        asChild
        defaultOpen={true}
        className="group/sidebar-space"
      >
        <div>
          <div className="flex w-full min-w-0 flex-row items-center hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8">
            <CollapsibleTrigger asChild>
              <button className="group/space-button flex items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm flex-1">
                <Avatar
                  id={space.id}
                  avatar={space.attributes.avatar}
                  name={space.attributes.name}
                  className="size-4 group-hover/space-button:hidden"
                />
                <ChevronRight className="hidden size-4 transition-transform duration-200 group-hover/space-button:block group-data-[state=open]/sidebar-space:rotate-90" />
                <span>{space.attributes.name}</span>
              </button>
            </CollapsibleTrigger>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground opacity-0 transition-opacity group-hover/sidebar-space:opacity-100 flex items-center justify-center p-0 mr-1 size-4 focus-visible:outline-none focus-visible:ring-0">
                  <Ellipsis />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="ml-1 w-72">
                <DropdownMenuLabel>
                  {space.attributes.name ?? 'Unnamed'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setOpenCreatePage(true)}>
                  <div className="flex flex-row items-center gap-2">
                    <StickyNote className="size-4" />
                    <span>Add page</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setOpenCreateChannel(true)}>
                  <div className="flex flex-row items-center gap-2">
                    <MessageCircle className="size-4" />
                    <span>Add channel</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setOpenCreateDatabase(true)}>
                  <div className="flex flex-row items-center gap-2">
                    <Database className="size-4" />
                    <span>Add database</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setOpenCreateFolder(true)}>
                  <div className="flex flex-row items-center gap-2">
                    <Folder className="size-4" />
                    <span>Add folder</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setSettingsState({ open: true })}
                >
                  <div className="flex flex-row items-center gap-2">
                    <Settings className="size-4" />
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
                    <Plus className="size-4" />
                    <span>Add collaborators</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CollapsibleContent>
            <ul className="mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5 mr-0 pr-0">
              {children.map((child) => (
                <li
                  key={child.id}
                  onClick={() => {
                    workspace.openInMain(child.id);
                  }}
                  className="cursor-pointer"
                >
                  <div
                    className={cn(
                      'text-sm flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      workspace.isEntryActive(child.id) &&
                        'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    )}
                  >
                    <EntrySidebarItem entry={child} />
                  </div>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </div>
      </Collapsible>
      {openCreateChannel && (
        <ChannelCreateDialog
          spaceId={space.id}
          open={openCreateChannel}
          onOpenChange={setOpenCreateChannel}
        />
      )}
      {openCreatePage && (
        <PageCreateDialog
          spaceId={space.id}
          open={openCreatePage}
          onOpenChange={setOpenCreatePage}
        />
      )}
      {openCreateDatabase && (
        <DatabaseCreateDialog
          spaceId={space.id}
          open={openCreateDatabase}
          onOpenChange={setOpenCreateDatabase}
        />
      )}
      {openCreateFolder && (
        <FolderCreateDialog
          spaceId={space.id}
          open={openCreateFolder}
          onOpenChange={setOpenCreateFolder}
        />
      )}
      {settingsState.open && (
        <SpaceSettingsDialog
          space={space}
          open={settingsState.open}
          onOpenChange={(open) =>
            setSettingsState({ open, tab: settingsState.tab })
          }
          defaultTab={settingsState.tab}
        />
      )}
    </React.Fragment>
  );
};
