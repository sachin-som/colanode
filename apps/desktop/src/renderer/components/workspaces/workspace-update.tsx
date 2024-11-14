import { toast } from '@/renderer/hooks/use-toast';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { WorkspaceForm } from './workspace-form';
import { Workspace } from '@/shared/types/workspaces';

interface WorkspaceUpdateProps {
  workspace: Workspace;
}

export const WorkspaceUpdate = ({ workspace }: WorkspaceUpdateProps) => {
  const { mutate, isPending } = useMutation();
  const canEdit = workspace.role === 'owner';

  return (
    <WorkspaceForm
      readOnly={!canEdit}
      values={{
        name: workspace.name,
        description: workspace.description ?? '',
        avatar: workspace.avatar ?? null,
      }}
      onSubmit={(values) => {
        mutate({
          input: {
            type: 'workspace_update',
            id: workspace.id,
            accountId: workspace.accountId,
            name: values.name,
            description: values.description,
            avatar: values.avatar ?? null,
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
