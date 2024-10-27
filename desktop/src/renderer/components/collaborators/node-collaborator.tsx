import React from 'react';
import { NodeCollaboratorNode } from '@/types/nodes';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { NodeCollaboratorRoleDropdown } from '@/renderer/components/collaborators/node-collaborator-role-dropdown';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { Trash2 } from 'lucide-react';

interface NodeCollaboratorProps {
  nodeId: string;
  collaborator: NodeCollaboratorNode;
  removable?: boolean;
}

export const NodeCollaborator = ({
  nodeId,
  collaborator,
  removable,
}: NodeCollaboratorProps) => {
  const workspace = useWorkspace();
  const { mutate } = useMutation();

  return (
    <div className="flex items-center justify-between space-x-3">
      <div className="flex items-center space-x-3">
        <Avatar
          id={collaborator.id}
          name={collaborator.name}
          avatar={collaborator.avatar}
        />
        <div className="flex-grow">
          <p className="text-sm font-medium leading-none">
            {collaborator.name}
          </p>
          <p className="text-sm text-muted-foreground">{collaborator.email}</p>
        </div>
      </div>
      <div className="flex flex-row items-center gap-1">
        <NodeCollaboratorRoleDropdown
          value={collaborator.role}
          onChange={(newRole) => {
            mutate({
              input: {
                type: 'node_collaborator_update',
                nodeId: nodeId,
                collaboratorId: collaborator.id,
                role: newRole,
                userId: workspace.userId,
              },
            });
          }}
        />
        {removable && (
          <Trash2
            className="size-4 cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={() => {
              mutate({
                input: {
                  type: 'node_collaborator_delete',
                  nodeId: nodeId,
                  collaboratorId: collaborator.id,
                  userId: workspace.userId,
                },
              });
            }}
          />
        )}
      </div>
    </div>
  );
};
