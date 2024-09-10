import { useWorkspace } from '@/contexts/workspace';
import { AttributeTypes, NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';

interface ChannelCreateMutationInput {
  spaceId: string;
  name: string;
}

export const useChannelCreateMutation = () => {
  const workspace = useWorkspace();
  return useMutation({
    mutationFn: async (input: ChannelCreateMutationInput) => {
      const siblingsQuery = workspace.schema
        .selectFrom('nodes')
        .where('parent_id', '=', input.spaceId)
        .selectAll()
        .compile();

      const result = await workspace.query(siblingsQuery);
      const siblings = result.rows;
      const maxIndex =
        siblings.length > 0
          ? siblings.sort((a, b) => compareString(a.index, b.index))[
              siblings.length - 1
            ].index
          : null;

      const channelId = NeuronId.generate(NeuronId.Type.Channel);
      const insertChannelQuery = workspace.schema
        .insertInto('nodes')
        .values({
          id: channelId,
          type: NodeTypes.Channel,
          parent_id: input.spaceId,
          index: generateNodeIndex(maxIndex, null),
          content: null,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .compile();

      const insertChannelNameQuery = workspace.schema
        .insertInto('node_attributes')
        .values({
          node_id: channelId,
          type: AttributeTypes.Name,
          key: '1',
          text_value: input.name,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .compile();

      await workspace.mutate([insertChannelQuery, insertChannelNameQuery]);
      return channelId;
    },
  });
};
