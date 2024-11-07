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
import { ChevronsUpDown, Settings, Plus } from 'lucide-react';

export const SidebarHeader = () => {
  const workspace = useWorkspace();
  const account = useAccount();
  const navigate = useNavigate();
  const sidebar = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
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
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={sidebar.isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuItem
              className="gap-2 p-2 text-muted-foreground"
              onClick={() => {
                workspace.openSettings();
              }}
            >
              <Settings className="size-4" />
              <p className="font-medium">Settings</p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            {account.workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => {
                  navigate(`/${workspace.id}`);
                }}
                className="gap-2 p-2"
              >
                <Avatar
                  id={workspace.id}
                  avatar={workspace.avatar}
                  name={workspace.name}
                  size="small"
                />
                {workspace.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
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
