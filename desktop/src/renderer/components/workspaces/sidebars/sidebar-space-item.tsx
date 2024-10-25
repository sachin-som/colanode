import React from 'react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/renderer/components/ui/collapsible';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/renderer/components/ui/sidebar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { FolderCreateDialog } from '@/renderer/components/folders/folder-create-dialog';
import { SpaceSettingsDialog } from '@/renderer/components/spaces/space-settings-dialog';

interface SettingsState {
  open: boolean;
  tab?: string;
}

interface SidebarSpaceNodeProps {
  node: SidebarSpaceNode;
}

export const SidebarSpaceItem = ({ node }: SidebarSpaceNodeProps) => {
  const workspace = useWorkspace();

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
      <Collapsible
        key={node.id}
        asChild
        defaultOpen={true}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={node.name}
              className="group/space-button"
            >
              <Avatar
                id={node.id}
                avatar={node.avatar}
                name={node.name}
                className="h-4 w-4 group-hover/space-button:hidden"
              />
              <Icon
                name="arrow-right-s-line"
                className="hidden h-4 w-4 transition-transform duration-200 group-hover/space-button:block group-data-[state=open]/collapsible:rotate-90"
              />
              <span>{node.name}</span>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction
                showOnHover
                className="h-5 w-5 focus-visible:outline-none focus-visible:ring-0"
              >
                <Icon name="more-line" />
              </SidebarMenuAction>
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
              <DropdownMenuItem
                onClick={() => setSettingsState({ open: true })}
              >
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

          <CollapsibleContent>
            <SidebarMenuSub>
              {node.children.map((child) => (
                <SidebarMenuSubItem
                  key={child.id}
                  onClick={() => {
                    workspace.navigateToNode(child.id);
                  }}
                  className="cursor-pointer"
                >
                  <SidebarMenuSubButton>
                    <SidebarItem node={child} />
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
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
      {openCreateFolder && (
        <FolderCreateDialog
          spaceId={node.id}
          open={openCreateFolder}
          onOpenChange={setOpenCreateFolder}
        />
      )}
      {settingsState.open && (
        <SpaceSettingsDialog
          id={node.id}
          name={node.name}
          avatar={node.avatar}
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
