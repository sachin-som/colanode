import { FolderEntry, hasEditorAccess, EntryRole } from '@colanode/core';
import { Copy, Image, LetterText, Settings, Trash2 } from 'lucide-react';
import React from 'react';

import { EntryCollaboratorAudit } from '@/renderer/components/collaborators/entry-collaborator-audit';
import { FolderDeleteDialog } from '@/renderer/components/folders/folder-delete-dialog';
import { FolderUpdateDialog } from '@/renderer/components/folders/folder-update-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';

interface FolderSettingsProps {
  folder: FolderEntry;
  role: EntryRole;
}

export const FolderSettings = ({ folder, role }: FolderSettingsProps) => {
  const [showUpdateDialog, setShowUpdateDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteModal] = React.useState(false);

  const canEdit = hasEditorAccess(role);
  const canDelete = hasEditorAccess(role);

  return (
    <React.Fragment>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Settings className="size-5 cursor-pointer text-muted-foreground hover:text-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" className="mr-2 w-80">
          <DropdownMenuLabel>{folder.attributes.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex items-center gap-2"
            onClick={() => {
              if (!canEdit) {
                return;
              }

              setShowUpdateDialog(true);
            }}
            disabled={!canEdit}
          >
            <LetterText className="size-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2"
            disabled={!canEdit}
            onClick={() => {
              if (!canEdit) {
                return;
              }

              setShowUpdateDialog(true);
            }}
          >
            <Image className="size-4" />
            Update icon
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2" disabled>
            <Copy className="size-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2"
            onClick={() => {
              if (!canDelete) {
                return;
              }

              setShowDeleteModal(true);
            }}
            disabled={!canDelete}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Created by</DropdownMenuLabel>
          <DropdownMenuItem>
            <EntryCollaboratorAudit
              collaboratorId={folder.createdBy}
              date={folder.createdAt}
            />
          </DropdownMenuItem>
          {folder.updatedBy && folder.updatedAt && (
            <React.Fragment>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Last updated by</DropdownMenuLabel>
              <DropdownMenuItem>
                <EntryCollaboratorAudit
                  collaboratorId={folder.updatedBy}
                  date={folder.updatedAt}
                />
              </DropdownMenuItem>
            </React.Fragment>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <FolderDeleteDialog
        entryId={folder.id}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteModal}
      />
      <FolderUpdateDialog
        folder={folder}
        role={role}
        open={showUpdateDialog}
        onOpenChange={setShowUpdateDialog}
      />
    </React.Fragment>
  );
};
