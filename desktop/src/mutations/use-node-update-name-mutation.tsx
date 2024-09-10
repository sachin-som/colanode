import { useWorkspace } from '@/contexts/workspace';
import { AttributeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { useMutation } from '@tanstack/react-query';

interface NodeUpdateNameInput {
  id: string;
  name: string;
}

export const useNodeUpdateNameMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: NodeUpdateNameInput) => {
      const { id, name } = input;

      const query = workspace.schema
        .insertInto('node_attributes')
        .values({
          node_id: id,
          type: AttributeTypes.Name,
          key: '1',
          text_value: name,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .onConflict((b) =>
          b.doUpdateSet({
            text_value: name,
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
