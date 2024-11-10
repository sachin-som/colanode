import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { Server } from '@/types/servers';
import { ServerCreateDialog } from '@/renderer/components/servers/server-create-dialog';
import { DropdownMenuSeparator } from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { useApp } from '@/renderer/contexts/app';

interface ServerDropdownProps {
  value: Server;
  onChange: (server: Server) => void;
}

export const ServerDropdown = ({ value, onChange }: ServerDropdownProps) => {
  const app = useApp();
  const [openCreate, setOpenCreate] = React.useState(false);

  return (
    <React.Fragment>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex w-full flex-grow flex-row items-center gap-2 rounded-md border border-input p-2 hover:cursor-pointer hover:bg-gray-100">
            <Avatar id={value.domain} name={value.name} />
            <div className="flex-grow">
              <p className="flex-grow font-semibold">{value.name}</p>
              <p className="text-xs text-muted-foreground">{value.domain}</p>
            </div>
            <ChevronDown className="size-4 text-muted-foreground" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-96">
          {app.servers.map((server) => (
            <DropdownMenuItem
              key={server.domain}
              onSelect={() => {
                if (value.domain !== server.domain) {
                  onChange(server);
                }
              }}
              className="flex w-full flex-grow flex-row items-center gap-2 rounded-md border-b border-input p-2 hover:cursor-pointer hover:bg-gray-100"
            >
              <Avatar id={server.domain} name={server.name} />
              <div className="flex-grow">
                <p className="flex-grow font-semibold">{server.name}</p>
                <p className="text-xs text-muted-foreground">{server.domain}</p>
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setOpenCreate(true);
            }}
            className="py-2"
          >
            Add new server
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {openCreate && (
        <ServerCreateDialog open={openCreate} onOpenChange={setOpenCreate} />
      )}
    </React.Fragment>
  );
};
