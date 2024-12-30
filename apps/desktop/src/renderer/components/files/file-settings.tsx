import { Copy, Settings, Trash2 } from 'lucide-react';
import React from 'react';
import { Entry, EntryRole, hasEntryRole } from '@colanode/core';

import { FileDeleteDialog } from '@/renderer/components/files/file-delete-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { FileWithState } from '@/shared/types/files';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface FileSettingsProps {
  file: FileWithState;
  role: EntryRole;
  entry: Entry;
}

export const FileSettings = ({ file, role, entry }: FileSettingsProps) => {
  const workspace = useWorkspace();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const canDelete =
    file.parentId === entry.id &&
    (file.createdBy === workspace.userId || hasEntryRole(role, 'editor'));

  return (
    <React.Fragment>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Settings className="size-5 cursor-pointer text-muted-foreground hover:text-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" className="mr-2 w-56">
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
        </DropdownMenuContent>
      </DropdownMenu>
      {canDelete && (
        <FileDeleteDialog
          fileId={file.id}
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
        />
      )}
    </React.Fragment>
  );
};
