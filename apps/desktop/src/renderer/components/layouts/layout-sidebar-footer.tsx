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
import { Avatar } from '@/renderer/components/avatars/avatar';
import { useAccount } from '@/renderer/contexts/account';
import { ChevronsUpDown, LogOut, Plus, Settings } from 'lucide-react';
import { useApp } from '@/renderer/contexts/app';
import { useNavigate } from 'react-router-dom';

export function LayoutSidebarFooter() {
  const app = useApp();
  const account = useAccount();
  const sidebar = useSidebar();
  const navigate = useNavigate();

  const [open, setOpen] = React.useState(false);

  const otherAccounts = app.accounts.filter((a) => a.id !== account.id);

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
            <DropdownMenuItem key={account.id} className="p-0">
              <div className="w-full flex items-center gap-2 px-1 py-1.5 text-left text-sm">
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
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => {
                account.openSettings();
              }}
            >
              <Settings className="size-4" />
              <p className="font-medium">Settings</p>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => {
                account.openLogout();
              }}
            >
              <LogOut className="size-4" />
              <p className="font-medium">Logout</p>
            </DropdownMenuItem>
            {otherAccounts.length > 0 && (
              <React.Fragment>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="mb-1">
                  Other accounts
                </DropdownMenuLabel>
                {otherAccounts.map((otherAccount) => (
                  <DropdownMenuItem
                    key={otherAccount.id}
                    className="p-0"
                    onClick={() => {
                      navigate(`/${otherAccount.id}`);
                    }}
                  >
                    <div className="w-full flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar
                        className="h-8 w-8 rounded-lg"
                        id={otherAccount.id}
                        name={otherAccount.name}
                        avatar={otherAccount.avatar}
                      />
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {otherAccount.name}
                        </span>
                        <span className="truncate text-xs">
                          {otherAccount.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </React.Fragment>
            )}

            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                navigate(`/login`);
              }}
            >
              <Plus className="size-4" />
              <p className="font-medium">Add account</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
