import React from 'react';
import { Separator } from '@/renderer/components/ui/separator';
import { NodeCollaborator } from '@/renderer/components/collaborators/node-collaborator';
import { NodeCollaboratorCreate } from '@/renderer/components/collaborators/node-collaborator-create';
import { extractNodeName, Node } from '@colanode/core';
import { buildNodeCollaborators } from '@/lib/nodes';

interface NodeCollaboratorsProps {
  nodeId: string;
  nodes: Node[];
}

export const NodeCollaborators = ({
  nodeId,
  nodes,
}: NodeCollaboratorsProps) => {
  const collaborators = buildNodeCollaborators(nodes);
  const directCollaborators = collaborators.filter(
    (collaborator) => collaborator.nodeId === nodeId
  );
  const directCollaboratorIds = directCollaborators.map(
    (collaborator) => collaborator.collaboratorId
  );

  const ancestors = nodes.reverse().filter((node) => node.id !== nodeId);

  return (
    <div className="flex flex-col gap-2">
      <NodeCollaboratorCreate
        nodeId={nodeId}
        existingCollaborators={directCollaboratorIds}
      />
      <Separator />
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Direct access</h4>
        <div className="flex flex-col gap-3">
          {directCollaborators.length > 0 ? (
            <React.Fragment>
              {directCollaborators.map((collaborator) => (
                <NodeCollaborator
                  key={collaborator.collaboratorId}
                  nodeId={nodeId}
                  collaboratorId={collaborator.collaboratorId}
                  role={collaborator.role}
                  removable={true}
                />
              ))}
            </React.Fragment>
          ) : (
            <span className="text-xs text-muted-foreground">
              No direct access.
            </span>
          )}
        </div>
      </div>
      {ancestors.map((node) => {
        const inheritCollaborators = collaborators.filter(
          (collaborator) => collaborator.nodeId === node.id
        );

        if (inheritCollaborators.length === 0) {
          return null;
        }

        const name = extractNodeName(node.attributes) ?? 'Unknown';
        return (
          <div key={node.id}>
            <Separator className="my-3" />
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Inherit from {name}</h4>
              <div className="flex flex-col gap-3">
                {inheritCollaborators.map((collaborator) => (
                  <NodeCollaborator
                    key={collaborator.collaboratorId}
                    nodeId={nodeId}
                    collaboratorId={collaborator.collaboratorId}
                    role={collaborator.role}
                    removable={false}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
