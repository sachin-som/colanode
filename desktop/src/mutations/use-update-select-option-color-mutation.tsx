import { useWorkspace } from '@/contexts/workspace';
import { AttributeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { useMutation } from '@tanstack/react-query';

interface UpdateSelectOptionColorInput {
  id: string;
  color: string;
}

export const useUpdateSelectOptionColorMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: UpdateSelectOptionColorInput) => {
      const { id, color } = input;

      const query = workspace.schema
        .insertInto('node_attributes')
        .values({
          node_id: id,
          type: AttributeTypes.Color,
          key: '1',
          text_value: color,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .onConflict((b) =>
          b.doUpdateSet({
            text_value: color,
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
