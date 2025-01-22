import {
  Entry,
  EntryRole,
  extractEntryName,
  hasEntryRole,
} from '@colanode/core';
import React from 'react';

import { EntryCollaborator } from '@/renderer/components/collaborators/entry-collaborator';
import { EntryCollaboratorCreate } from '@/renderer/components/collaborators/entry-collaborator-create';
import { Separator } from '@/renderer/components/ui/separator';
import { buildEntryCollaborators } from '@/shared/lib/entries';

interface EntryCollaboratorsProps {
  entry: Entry;
  entries: Entry[];
  role: EntryRole;
}

export const EntryCollaborators = ({
  entry,
  entries,
  role,
}: EntryCollaboratorsProps) => {
  const collaborators = buildEntryCollaborators(entries);
  const directCollaborators = collaborators.filter(
    (collaborator) => collaborator.entryId === entry.id
  );
  const directCollaboratorIds = directCollaborators.map(
    (collaborator) => collaborator.collaboratorId
  );

  const isAdmin = hasEntryRole(role, 'admin');
  const canAddCollaborator = isAdmin && entry.type === 'space';
  const ancestors = entries.filter((entry) => entry.id !== entry.id);

  return (
    <div className="flex flex-col gap-2">
      {canAddCollaborator && (
        <React.Fragment>
          <EntryCollaboratorCreate
            entryId={entry.id}
            existingCollaborators={directCollaboratorIds}
          />
          <Separator />
        </React.Fragment>
      )}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Direct access</h4>
        <div className="flex flex-col gap-3">
          {directCollaborators.length > 0 ? (
            <React.Fragment>
              {directCollaborators.map((collaborator) => {
                // you can edit only if you have admin access
                // and there is at least one more admin

                let canEdit = isAdmin;
                if (canEdit && collaborator.role === 'admin') {
                  const otherAdmins = collaborators.filter(
                    (c) =>
                      c.collaboratorId !== collaborator.collaboratorId &&
                      c.role === 'admin'
                  ).length;

                  canEdit = otherAdmins > 0;
                }

                return (
                  <EntryCollaborator
                    key={collaborator.collaboratorId}
                    entryId={entry.id}
                    collaboratorId={collaborator.collaboratorId}
                    role={collaborator.role}
                    canEdit={canEdit}
                    canRemove={canEdit}
                  />
                );
              })}
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
          (collaborator) => collaborator.entryId === node.id
        );

        if (inheritCollaborators.length === 0) {
          return null;
        }

        const name = extractEntryName(node.attributes) ?? 'Unknown';
        return (
          <div key={node.id}>
            <Separator className="my-3" />
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Inherit from {name}</h4>
              <div className="flex flex-col gap-3">
                {inheritCollaborators.map((collaborator) => {
                  const canEdit = isAdmin && collaborator.role !== 'admin';

                  return (
                    <EntryCollaborator
                      key={collaborator.collaboratorId}
                      entryId={node.id}
                      collaboratorId={collaborator.collaboratorId}
                      role={collaborator.role}
                      canEdit={canEdit}
                      canRemove={false}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
