import { useWorkspace } from '@/contexts/workspace';
import { NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
import { useMutation } from '@tanstack/react-query';

interface RecordCreateInput {
  databaseId: string;
}

export const useRecordCreateMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: RecordCreateInput) => {
      const lastChildQuery = workspace.schema
        .selectFrom('nodes')
        .where('parent_id', '=', input.databaseId)
        .selectAll()
        .orderBy('index', 'desc')
        .limit(1)
        .compile();

      const result = await workspace.query(lastChildQuery);
      const lastChild =
        result.rows && result.rows.length > 0 ? result.rows[0] : null;
      const maxIndex = lastChild?.index ? lastChild.index : null;

      const index = generateNodeIndex(maxIndex, null);
      const query = workspace.schema
        .insertInto('nodes')
        .values({
          id: NeuronId.generate(NeuronId.Type.Record),
          type: NodeTypes.Record,
          parent_id: input.databaseId,
          index,
          content: null,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .compile();

      await workspace.mutate(query);
    },
  });
};
