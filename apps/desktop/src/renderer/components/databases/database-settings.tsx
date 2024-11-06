import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { Copy, Settings, Trash2 } from 'lucide-react';
import { DatabaseDeleteDialog } from '@/renderer/components/databases/database-delete-dialog';

interface DatabaseSettingsProps {
  nodeId: string;
}

export const DatabaseSettings = ({ nodeId }: DatabaseSettingsProps) => {
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
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
              setShowDeleteModal(true);
            }}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DatabaseDeleteDialog
        nodeId={nodeId}
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
      />
    </React.Fragment>
  );
};
