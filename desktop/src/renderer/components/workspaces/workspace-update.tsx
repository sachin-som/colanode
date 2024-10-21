import React from 'react';
import { toast } from '@/renderer/hooks/use-toast';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { WorkspaceForm } from './workspace-form';

export const WorkspaceUpdate = () => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  return (
    <WorkspaceForm
      values={{
        name: workspace.name,
        description: workspace.description,
        avatar: workspace.avatar,
      }}
      onSubmit={(values) => {
        mutate({
          input: {
            type: 'workspace_update',
            id: workspace.id,
            accountId: workspace.accountId,
            name: values.name,
            description: values.description,
            avatar: values.avatar,
          },
          onSuccess() {
            toast({
              title: 'Workspace updated',
              description: 'Workspace was updated successfully',
              variant: 'default',
            });
          },
          onError() {
            toast({
              title: 'Failed to update workspace',
              description:
                'Something went wrong updating workspace. Please try again!',
              variant: 'destructive',
            });
          },
        });
      }}
      isSaving={isPending}
      saveText="Update"
    />
  );
};
