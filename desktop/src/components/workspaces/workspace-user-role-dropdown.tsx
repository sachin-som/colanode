import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WorkspaceRole } from '@/types/workspaces';
import { Spinner } from '@/components/ui/spinner';
import { Icon } from '@/components/ui/icon';
import { useWorkspaceAccountRoleUpdateMutation } from '@/mutations/use-workspace-account-role-update-mutation';
import { parseApiError } from '@/lib/axios';
import { toast } from '@/components/ui/use-toast';

interface WorkspaceRoleItem {
  name: string;
  value: WorkspaceRole;
  description: string;
  enabled: boolean;
}

const roles: WorkspaceRoleItem[] = [
  {
    name: 'Owner',
    value: WorkspaceRole.Owner,
    description: 'Owner',
    enabled: false,
  },
  {
    name: 'Admin',
    value: WorkspaceRole.Admin,
    description: 'Administration access',
    enabled: true,
  },
  {
    name: 'Collaborator',
    value: WorkspaceRole.Collaborator,
    description: 'Can contribute in content',
    enabled: true,
  },
];

interface WorkspaceUserRoleDropdownProps {
  accountId: string;
  value: WorkspaceRole;
}

export const WorkspaceUserRoleDropdown = ({
  accountId,
  value,
}: WorkspaceUserRoleDropdownProps) => {
  const { mutate, isPending } = useWorkspaceAccountRoleUpdateMutation();
  const currentRole = roles.find((role) => role.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <p className="flex cursor-pointer flex-row items-center p-1 text-sm text-muted-foreground hover:bg-gray-50">
          {currentRole?.name}
          {isPending ? (
            <Spinner className="ml-2 text-muted-foreground" />
          ) : (
            <Icon
              name="arrow-down-s-line"
              className="ml-2 h-4 w-4 text-muted-foreground"
            />
          )}
        </p>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {roles.map((role) => (
          <DropdownMenuItem
            key={role.value}
            onSelect={() => {
              if (isPending) {
                return;
              }

              mutate(
                {
                  accountId,
                  role: role.value,
                },
                {
                  onError: (error) => {
                    const apiError = parseApiError(error);
                    toast({
                      title: 'Failed to update role',
                      description: apiError.message,
                      variant: 'destructive',
                    });
                  },
                },
              );
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
