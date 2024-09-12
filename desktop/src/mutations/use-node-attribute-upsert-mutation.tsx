import { useWorkspace } from '@/contexts/workspace';
import { NeuronId } from '@/lib/id';
import { useMutation } from '@tanstack/react-query';

interface NodeAttributeUpsertInput {
  nodeId: string;
  type: string;
  key: string;
  textValue: string | null;
  numberValue: number | null;
  foreignNodeId: string | null;
}

export const useNodeAttributeUpsertMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: NodeAttributeUpsertInput) => {
      const query = workspace.schema
        .insertInto('node_attributes')
        .values({
          node_id: input.nodeId,
          type: input.type,
          key: input.key,
          text_value: input.textValue,
          number_value: input.numberValue,
          foreign_node_id: input.foreignNodeId,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .onConflict((b) =>
          b.doUpdateSet({
            text_value: input.textValue,
            number_value: input.numberValue,
            foreign_node_id: input.foreignNodeId,
            updated_at: new Date().toISOString(),
            updated_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          }),
        )
        .compile();

      await workspace.mutate(query);
    },
  });
};
