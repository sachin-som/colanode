import React from 'react';
import { Avatar } from '@/renderer/components/avatars/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
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
import {
  Ellipsis,
  MessageCircle,
  StickyNote,
  Database,
  Folder,
  Settings,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { useParams } from 'react-router-dom';

interface SettingsState {
  open: boolean;
  tab?: string;
}

interface SidebarSpaceNodeProps {
  node: SidebarSpaceNode;
}

export const SidebarSpaceItem = ({ node }: SidebarSpaceNodeProps) => {
  const workspace = useWorkspace();
  const { nodeId } = useParams<{ nodeId?: string }>();

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
              tooltip={node.name ?? ''}
              className="group/space-button"
            >
              <Avatar
                id={node.id}
                avatar={node.avatar}
                name={node.name}
                className="size-4 group-hover/space-button:hidden"
              />
              <ChevronRight className="hidden size-4 transition-transform duration-200 group-hover/space-button:block group-data-[state=open]/collapsible:rotate-90" />
              <span>{node.name}</span>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction
                showOnHover
                className="size-4 focus-visible:outline-none focus-visible:ring-0"
              >
                <Ellipsis />
              </SidebarMenuAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="ml-1 w-72">
              <DropdownMenuLabel>{node.name ?? 'Unnamed'}</DropdownMenuLabel>
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

          <CollapsibleContent>
            <SidebarMenuSub className="mr-0 pr-0">
              {node.children.map((child) => (
                <SidebarMenuSubItem
                  key={child.id}
                  onClick={() => {
                    workspace.navigateToNode(child.id);
                  }}
                  className="cursor-pointer"
                >
                  <SidebarMenuSubButton isActive={nodeId === child.id}>
                    <SidebarItem node={child} isActive={nodeId === child.id} />
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
