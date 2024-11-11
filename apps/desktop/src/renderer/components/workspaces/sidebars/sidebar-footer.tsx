import React from 'react';
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
import { Avatar } from '@/renderer/components/avatars/avatar';
import { useAccount } from '@/renderer/contexts/account';
import { ChevronsUpDown, LogOut, Plus, Settings } from 'lucide-react';
import { useApp } from '@/renderer/contexts/app';

export function SidebarFooter() {
  const [open, setOpen] = React.useState(false);

  const app = useApp();
  const account = useAccount();
  const sidebar = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar
                className="h-8 w-8 rounded-lg"
                id={account.id}
                name={account.name}
                avatar={account.avatar}
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{account.name}</span>
                <span className="truncate text-xs">{account.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-80 rounded-lg"
            side={sidebar.isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="mb-1">Accounts</DropdownMenuLabel>
            {app.accounts.map((account) => (
              <DropdownMenuItem
                key={account.id}
                className="p-0"
                onClick={() => {
                  app.setAccount(account.id);
                }}
              >
                <div className="w-full flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar
                    className="h-8 w-8 rounded-lg"
                    id={account.id}
                    name={account.name}
                    avatar={account.avatar}
                  />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {account.name}
                    </span>
                    <span className="truncate text-xs">{account.email}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-2 text-muted-foreground mr-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <LogOut
                          className="size-4 hover:cursor-pointer hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            app.showAccountLogout(account.id);
                            setOpen(false);
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="flex flex-row items-center gap-2">
                        Log out
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Settings
                          className="size-4 hover:cursor-pointer hover:text-sidebar-accent-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            app.showAccountSettings(account.id);
                            setOpen(false);
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="flex flex-row items-center gap-2">
                        Settings
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => {
                app.showAccountLogin();
              }}
            >
              <Plus className="size-4" />
              Add account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
