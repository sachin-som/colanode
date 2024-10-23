import React from 'react';
import { FileDeleteDialog } from '@/renderer/components/files/file-delete-dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/renderer/components/ui/context-menu';
import { Icon } from '@/renderer/components/ui/icon';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface FileContextMenuProps {
  id: string;
  children: React.ReactNode;
}

export const FileContextMenu = ({ id, children }: FileContextMenuProps) => {
  const workspace = useWorkspace();
  const [openDelete, setOpenDelete] = React.useState(false);

  return (
    <React.Fragment>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem
            onSelect={() => {
              workspace.openModal(id);
            }}
            className="pl-2"
          >
            <ContextMenuShortcut className="ml-0">
              <Icon name="folder-line" className="mr-2 h-4 w-4" />
            </ContextMenuShortcut>
            Open
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => setOpenDelete(true)}
            className="flex items-center gap-x-2 pl-2 text-red-500"
          >
            <ContextMenuShortcut className="ml-0">
              <Icon name="delete-bin-line" className="h-4 w-4 text-red-500" />
            </ContextMenuShortcut>
            <span className="text-red-500">Delete</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <FileDeleteDialog
        id={id}
        open={openDelete}
        onOpenChange={setOpenDelete}
      />
    </React.Fragment>
  );
};
