import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';

interface NodeCollaboratorPermission {
  name: string;
  value: string;
  description: string;
  enabled: boolean;
}

const permissions: NodeCollaboratorPermission[] = [
  {
    name: 'Owner',
    value: 'owner',
    description: 'Owner',
    enabled: false,
  },
  {
    name: 'Admin',
    value: 'admin',
    description: 'Administration access',
    enabled: true,
  },
  {
    name: 'Collaborator',
    value: 'collaborator',
    description: 'Can contribute in content',
    enabled: true,
  },
];

interface NodeCollaboratorPermissionDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export const NodeCollaboratorPermissionDropdown = ({
  value,
  onChange,
}: NodeCollaboratorPermissionDropdownProps) => {
  const currentPermission = permissions.find((role) => role.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <p className="flex cursor-pointer flex-row items-center p-1 text-sm text-muted-foreground hover:bg-gray-50">
          {currentPermission?.name}
          <Icon
            name="arrow-down-s-line"
            className="ml-2 h-4 w-4 text-muted-foreground"
          />
        </p>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {permissions.map((permission) => (
          <DropdownMenuItem
            key={permission.value}
            onSelect={() => {
              onChange(permission.value);
            }}
          >
            <div className="flex w-full flex-row items-center justify-between">
              <div className="flex w-full flex-col">
                <p className="mb-1 text-sm font-medium leading-none">
                  {permission.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {permission.description}
                </p>
              </div>
              {value === permission.value && (
                <Icon name="check-line" className="mr-2 h-4 w-4" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
