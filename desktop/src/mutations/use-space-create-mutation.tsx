import { useWorkspace } from '@/contexts/workspace';
import { AttributeTypes, NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
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

      const insertNodesQuery = workspace.schema
        .insertInto('nodes')
        .values([
          {
            id: spaceId,
            type: NodeTypes.Space,
            parent_id: null,
            index: null,
            content: null,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
          {
            id: pageId,
            type: NodeTypes.Page,
            parent_id: spaceId,
            index: pageIndex,
            content: null,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
          {
            id: channelId,
            type: NodeTypes.Channel,
            parent_id: spaceId,
            index: channelIndex,
            content: null,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
        ])
        .compile();

      const insertNodeAttributesQuery = workspace.schema
        .insertInto('node_attributes')
        .values([
          {
            node_id: spaceId,
            type: AttributeTypes.Name,
            key: '1',
            text_value: values.name,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
          {
            node_id: spaceId,
            type: AttributeTypes.Description,
            key: '1',
            text_value: values.description,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
          {
            node_id: pageId,
            type: AttributeTypes.Name,
            key: '1',
            text_value: 'Home',
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
          {
            node_id: channelId,
            type: AttributeTypes.Name,
            key: '1',
            text_value: 'Discussions',
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
        ])
        .compile();

      await workspace.mutate([insertNodesQuery, insertNodeAttributesQuery]);
      return spaceId;
    },
  });
};
