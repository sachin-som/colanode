import { useWorkspace } from '@/contexts/workspace';
import { NodePermission, NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { buildNodeInsertMutation, generateNodeIndex } from '@/lib/nodes';
import { useMutation } from '@tanstack/react-query';

interface SpaceCreateMutationInput {
  name: string;
  description: string;
}

export const useSpaceCreateMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (values: SpaceCreateMutationInput) => {
      const spaceId = NeuronId.generate(NeuronId.Type.Space);
      const pageId = NeuronId.generate(NeuronId.Type.Page);
      const channelId = NeuronId.generate(NeuronId.Type.Channel);

      const pageIndex = generateNodeIndex(null, null);
      const channelIndex = generateNodeIndex(pageIndex, null);

      const insertNodesQuery = buildNodeInsertMutation(
        workspace.schema,
        workspace.userId,
        [
          {
            id: spaceId,
            attributes: {
              type: NodeTypes.Space,
              name: values.name,
              description: values.description,
            },
          },
          {
            id: pageId,
            attributes: {
              type: NodeTypes.Page,
              parentId: spaceId,
              index: pageIndex,
              name: 'Home',
            },
          },
          {
            id: channelId,
            attributes: {
              type: NodeTypes.Channel,
              parentId: spaceId,
              index: channelIndex,
              name: 'Discussions',
            },
          },
        ],
      );

      const insertPermissionQuery = workspace.schema
        .insertInto('node_permissions')
        .values({
          node_id: spaceId,
          collaborator_id: workspace.userId,
          permission: NodePermission.Owner,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .compile();

      await workspace.mutate([insertNodesQuery, insertPermissionQuery]);
      return spaceId;
    },
  });
};
