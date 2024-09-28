import React from 'react';
import { NodeCollaboratorNode } from '@/types/nodes';
import { Avatar } from '@/components/ui/avatar';
import { NodeCollaboratorPermissionDropdown } from './node-collaborator-permission-dropdown';
import { Icon } from '@/components/ui/icon';
import { useNodeCollaboratorDeleteMutation } from '@/mutations/use-node-collaborator-delete-mutation';
import { useNodeCollaboratorUpdateMutation } from '@/mutations/use-node-collaborator-update-mutation';

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
  const { mutate: updateCollaborator } = useNodeCollaboratorUpdateMutation();
  const { mutate: deleteCollaborator } = useNodeCollaboratorDeleteMutation();
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
        <NodeCollaboratorPermissionDropdown
          value={collaborator.permission}
          onChange={(newPermission) => {
            updateCollaborator({
              nodeId: nodeId,
              collaboratorId: collaborator.id,
              permission: newPermission,
            });
          }}
        />
        {removable && (
          <Icon
            name="delete-bin-line"
            className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={() => {
              deleteCollaborator({
                nodeId: nodeId,
                collaboratorId: collaborator.id,
              });
            }}
          />
        )}
      </div>
    </div>
  );
};
