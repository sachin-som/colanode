import { useWorkspace } from '@/contexts/workspace';
import { AttributeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { useMutation } from '@tanstack/react-query';

interface UpdateViewFieldIndexInput {
  viewId: string;
  fieldId: string;
  index: string;
}

export const useUpdateViewFieldIndexMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: UpdateViewFieldIndexInput) => {
      const { viewId, fieldId, index } = input;

      const query = workspace.schema
        .insertInto('node_attributes')
        .values({
          node_id: viewId,
          type: AttributeTypes.FieldIndex,
          key: fieldId,
          text_value: index,
          foreign_node_id: fieldId,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .onConflict((ob) =>
          ob.doUpdateSet({
            text_value: index,
            foreign_node_id: fieldId,
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
