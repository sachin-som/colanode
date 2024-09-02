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
import { useWorkspace } from '@/contexts/workspace';
import { useMutation } from '@tanstack/react-query';

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
  const { mutate, isPending } = useMutation({
    mutationFn: async (fieldId: string) => {
      const mutation = workspace.schema
        .deleteFrom('nodes')
        .where('id', '=', fieldId)
        .compile();
      await workspace.mutate(mutation);
    },
  });
  const workspace = useWorkspace();

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
              mutate(id, {
                onSuccess: () => {
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
