import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { WorkspaceRole } from '@/types/workspaces';
import { Spinner } from '@/renderer/components/ui/spinner';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { Check, ChevronDown } from 'lucide-react';

interface WorkspaceRoleItem {
  name: string;
  value: WorkspaceRole;
  description: string;
  enabled: boolean;
}

const roles: WorkspaceRoleItem[] = [
  {
    name: 'Admin',
    value: 'admin',
    description: 'Administration access',
    enabled: true,
  },
  {
    name: 'Editor',
    value: 'editor',
    description: 'Can edit content',
    enabled: true,
  },
  {
    name: 'Collaborator',
    value: 'collaborator',
    description: 'Can contribute in content',
    enabled: true,
  },
  {
    name: 'Viewer',
    value: 'viewer',
    description: 'Can view content',
    enabled: true,
  },
];

interface WorkspaceUserRoleDropdownProps {
  userId: string;
  value: WorkspaceRole;
}

export const WorkspaceUserRoleDropdown = ({
  userId,
  value,
}: WorkspaceUserRoleDropdownProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();
  const currentRole = roles.find((role) => role.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <p className="flex cursor-pointer flex-row items-center p-1 text-sm text-muted-foreground hover:bg-gray-50">
          {currentRole?.name}
          {isPending ? (
            <Spinner className="ml-2 size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="ml-2 size-4 text-muted-foreground" />
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

              mutate({
                input: {
                  type: 'workspace_user_role_update',
                  userToUpdateId: userId,
                  role: role.value,
                  userId: workspace.userId,
                },
                onError() {
                  toast({
                    title: 'Failed to update role',
                    description:
                      'Something went wrong updating user role. Please try again!',
                    variant: 'destructive',
                  });
                },
              });
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
              {value === role.value && <Check className="mr-2 size-4" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
