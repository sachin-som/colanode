import React from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/renderer/components/ui/alert-dialog';
import { Button } from '@/renderer/components/ui/button';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface FieldDeleteDialogProps {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FieldDeleteDialog = ({
  id,
  open,
  onOpenChange,
}: FieldDeleteDialogProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want delete this field?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This field will no longer be
            accessible and all data in the field will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={async () => {
              mutate({
                input: {
                  type: 'node_delete',
                  nodeId: id,
                  userId: workspace.userId,
                },
                onSuccess() {
                  onOpenChange(false);
                },
              });
            }}
          >
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
