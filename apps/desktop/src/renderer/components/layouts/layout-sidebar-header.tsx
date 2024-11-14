import React from 'react';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { useAccount } from '@/renderer/contexts/account';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/renderer/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/renderer/components/ui/tooltip';
import { ChevronsUpDown, Settings, Plus } from 'lucide-react';
import { useRadar } from '@/renderer/contexts/radar';
import { useApp } from '@/renderer/contexts/app';

interface WorkspaceStateIndicatorProps {
  importantCount: number;
  hasUnseenChanges: boolean;
}

const WorkspaceStateIndicator = ({
  importantCount,
  hasUnseenChanges,
}: WorkspaceStateIndicatorProps) => {
  return (
    <React.Fragment>
      {importantCount > 0 && (
        <span className="mr-1 rounded-md px-1 py-0.5 text-xs bg-red-400 text-white">
          {importantCount}
        </span>
      )}
      {importantCount === 0 && hasUnseenChanges && (
        <span className="size-2 rounded-full bg-red-500" />
      )}
    </React.Fragment>
  );
};

export const LayoutSidebarHeader = () => {
  const app = useApp();
  const workspace = useWorkspace();
  const account = useAccount();
  const navigate = useNavigate();
  const sidebar = useSidebar();
  const radar = useRadar();

  const [open, setOpen] = React.useState(false);
  const otherWorkspaceStates = account.workspaces
    .filter((w) => w.id !== workspace.id)
    .map((w) => radar.getWorkspaceState(w.userId));
  const importantCount = otherWorkspaceStates.reduce(
    (acc, curr) => acc + curr.importantCount,
    0
  );
  const hasUnseenChanges = otherWorkspaceStates.some((w) => w.hasUnseenChanges);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="focus-visible:outline-none focus-visible:ring-0 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Avatar
                  id={workspace.id}
                  avatar={workspace.avatar}
                  name={workspace.name}
                  className="h-full w-full"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{workspace.name}</span>
                <span className="truncate text-xs">Free Plan</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
              <WorkspaceStateIndicator
                importantCount={importantCount}
                hasUnseenChanges={hasUnseenChanges}
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-80 rounded-lg"
            align="start"
            side={sidebar.isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="mb-1">Workspace</DropdownMenuLabel>
            {account.workspaces.map((workspaceItem) => {
              const workspaceState = radar.getWorkspaceState(
                workspaceItem.userId
              );
              return (
                <DropdownMenuItem
                  key={workspaceItem.id}
                  className="p-0"
                  onClick={() => {
                    navigate(`/${workspaceItem.userId}`);
                  }}
                >
                  <div className="w-full flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar
                      className="h-8 w-8 rounded-lg"
                      id={workspaceItem.id}
                      name={workspaceItem.name}
                      avatar={workspaceItem.avatar}
                    />
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {workspaceItem.name}
                      </span>
                      <span className="truncate text-xs">Free plan</span>
                    </div>
                    <div className="ml-auto flex items-center gap-2 text-muted-foreground mr-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Settings
                            className="size-4 hover:cursor-pointer hover:text-sidebar-accent-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              app.showWorkspaceSettings(workspaceItem.id);
                              setOpen(false);
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent className="flex flex-row items-center gap-2">
                          Settings
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <WorkspaceStateIndicator
                      importantCount={workspaceState.importantCount}
                      hasUnseenChanges={workspaceState.hasUnseenChanges}
                    />
                  </div>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              className="gap-2 p-2 text-muted-foreground"
              onClick={() => {
                navigate('/create');
              }}
            >
              <Plus className="size-4" />
              <p className="font-medium">Create workspace</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
