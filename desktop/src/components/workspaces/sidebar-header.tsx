import React from 'react';
import { useWorkspace } from '@/contexts/workspace';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Icon } from '@/components/ui/icon';
import { Avatar } from '@/components/ui/avatar';
import { useStore } from '@/contexts/store';
import { observer } from 'mobx-react-lite';

export const SidebarHeader = observer(() => {
  const store = useStore();
  const workspace = useWorkspace();

  const account = store.accounts[0];
  const workspaces = store.workspaces;

  return (
    <Popover>
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
      <PopoverContent align="start" className="flex w-96 flex-col gap-2 p-3">
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
          {workspaces.map((w) => {
            return (
              <li
                key={w.id}
                className="flex flex-row items-center gap-2 rounded-md p-2 pl-1 hover:cursor-pointer hover:bg-gray-100"
              >
                <Avatar id={w.id} name={w.name} className="h-7 w-7" />
                <p>{w.name}</p>
              </li>
            );
          })}
        </ul>
        <hr />
        <div className="flex flex-col gap-1">
          <button className="flex flex-row items-center gap-2 rounded-md p-1 pl-0 text-sm outline-none hover:cursor-pointer hover:bg-gray-100">
            <Icon name="add-line" />
            <span>Create workspace</span>
          </button>
          <button className="flex flex-row items-center gap-2 rounded-md p-1 pl-0 text-sm outline-none hover:cursor-pointer hover:bg-gray-100">
            <Icon name="settings-4-line" />
            <span>Settings</span>
          </button>
          <button className="flex flex-row items-center gap-2 rounded-md p-1 pl-0 text-sm outline-none hover:cursor-pointer hover:bg-gray-100">
            <Icon name="logout-circle-r-line" />
            <span>Logout</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
});
