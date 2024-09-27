import React from 'react';
import { useWorkspace } from '@/contexts/workspace';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Icon } from '@/components/ui/icon';
import { Avatar } from '@/components/ui/avatar';
import { useAccount } from '@/contexts/account';
import { useNavigate } from 'react-router-dom';

export const SidebarHeader = () => {
  const workspace = useWorkspace();
  const account = useAccount();
  const navigate = useNavigate();

  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="mb-1 flex h-12 cursor-pointer items-center justify-between border-b-2 border-gray-100 p-2 text-foreground/80 hover:bg-gray-200">
          <div className="flex flex-grow items-center gap-2">
            <Avatar
              id={workspace.id}
              name={workspace.name}
              className="h-7 w-7"
            />
            <p className="flex-grow">{workspace.name}</p>
          </div>
          <Icon name="expand-up-down-line" />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-96 flex-col gap-2 p-2">
        <h2 className="text-sm font-semibold">Account</h2>
        <div className="flex flex-grow items-start gap-2">
          <Avatar
            id={account.id}
            name={account.name}
            className="mt-1 h-7 w-7"
          />
          <div className="flex flex-grow flex-col">
            <p>{account.name}</p>
            <p className="text-xs text-muted-foreground">{account.email}</p>
          </div>
        </div>
        <hr className="-mx-1 my-1 h-px bg-muted" />
        <h2 className="text-sm font-semibold">Workspaces</h2>
        <ul className="flex flex-col gap-0.5">
          {account.workspaces.map((w) => {
            return (
              <li
                key={w.id}
                className="flex flex-row items-center gap-2 rounded-md p-2 pl-1 hover:cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  navigate(`/${w.id}`);
                  setOpen(false);
                }}
              >
                <Avatar id={w.id} name={w.name} className="h-7 w-7" />
                <p>{w.name}</p>
              </li>
            );
          })}
        </ul>
        <hr />
        <div className="flex flex-col">
          <button
            className="flex flex-row items-center gap-2 rounded-md p-1 pl-0 text-sm outline-none hover:cursor-pointer hover:bg-gray-100"
            onClick={() => {
              navigate('/create');
            }}
          >
            <Icon name="add-line" />
            <span>Create workspace</span>
          </button>
          <button
            className="flex flex-row items-center gap-2 rounded-md p-1 pl-0 text-sm outline-none hover:cursor-pointer hover:bg-gray-100"
            onClick={() => {
              workspace.openSettings();
            }}
          >
            <Icon name="settings-4-line" />
            <span>Settings</span>
          </button>
          <button
            className="flex flex-row items-center gap-2 rounded-md p-1 pl-0 text-sm outline-none hover:cursor-pointer hover:bg-gray-100"
            onClick={() => {
              account.logout();
            }}
          >
            <Icon name="logout-circle-r-line" />
            <span>Logout</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
