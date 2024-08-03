import React from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useWorkspace } from '@/contexts/workspace';

interface MessageDeleteButtonProps {
  id: string;
}

export const MessageDeleteButton = ({ id }: MessageDeleteButtonProps) => {
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const workspace = useWorkspace();

  return (
    <React.Fragment>
      <Icon name="delete-bin-line" onClick={() => setShowDeleteModal(true)} />
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want delete this message?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This message will no longer be
              accessible by you or others you&apos;ve shared it with.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={async () => {
                await workspace.deleteNode(id);
                setShowDeleteModal(false);
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </React.Fragment>
  );
};
