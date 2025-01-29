import React from 'react';

import { Button } from '@/renderer/components/ui/button';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/renderer/components/ui/alert-dialog';
import { Spinner } from '@/renderer/components/ui/spinner';

interface SpaceDeleteFormProps {
  id: string;
  onDeleted: () => void;
}

export const SpaceDeleteForm = ({ id, onDeleted }: SpaceDeleteFormProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-heading mb-px text-2xl font-semibold tracking-tight">
        Delete space
      </h3>
      <p>Deleting a space is permanent and cannot be undone.</p>
      <p>
        All data associated with the space will be deleted, including messages,
        pages, channels, databases, records, files and more.
      </p>
      <div>
        <Button
          variant="destructive"
          onClick={() => {
            setShowDeleteModal(true);
          }}
        >
          Delete space
        </Button>
      </div>
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want delete this space?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This space will no longer be
              accessible by you or others you&apos;ve shared it with.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                mutate({
                  input: {
                    type: 'space_delete',
                    accountId: workspace.accountId,
                    workspaceId: workspace.id,
                    spaceId: id,
                  },
                  onSuccess() {
                    setShowDeleteModal(false);
                    onDeleted();
                    toast({
                      title: 'Space deleted',
                      description: 'Space was deleted successfully',
                      variant: 'default',
                    });
                  },
                  onError(error) {
                    toast({
                      title: 'Failed to delete space',
                      description: error.message,
                      variant: 'destructive',
                    });
                  },
                });
              }}
            >
              {isPending && <Spinner className="mr-1" />}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
