import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { Icon } from '@/renderer/components/ui/icon';

interface NodeCollaboratorRole {
  name: string;
  value: string;
  description: string;
  enabled: boolean;
}

const roles: NodeCollaboratorRole[] = [
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

interface NodeCollaboratorRoleDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export const NodeCollaboratorRoleDropdown = ({
  value,
  onChange,
}: NodeCollaboratorRoleDropdownProps) => {
  const currentRole = roles.find((role) => role.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <p className="flex cursor-pointer flex-row items-center p-1 text-sm text-muted-foreground hover:bg-gray-50">
          {currentRole?.name}
          <Icon
            name="arrow-down-s-line"
            className="ml-2 h-4 w-4 text-muted-foreground"
          />
        </p>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {roles.map((role) => (
          <DropdownMenuItem
            key={role.value}
            onSelect={() => {
              onChange(role.value);
            }}
          >
            <div className="flex w-full flex-row items-center justify-between">
              <div className="flex w-full flex-col">
                <p className="mb-1 text-sm font-medium leading-none">
                  {role.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {role.description}
                </p>
              </div>
              {value === role.value && (
                <Icon name="check-line" className="mr-2 h-4 w-4" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
