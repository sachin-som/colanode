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
import { useMutation } from '@tanstack/react-query';

interface MessageDeleteButtonProps {
  id: string;
}

export const MessageDeleteButton = ({ id }: MessageDeleteButtonProps) => {
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const { mutate, isPending } = useMutation({
    mutationFn: async (messageId: string) => {
      const mutation = workspace.schema
        .deleteFrom('nodes')
        .where('id', '=', messageId)
        .compile();
        
      await workspace.mutate(mutation);
    },
  });
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
              disabled={isPending}
              onClick={async () => {
                mutate(id, {
                  onSuccess: () => {
                    setShowDeleteModal(false);
                  },
                });
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
