import { useWorkspace } from '@/contexts/workspace';
import { AttributeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { useMutation } from '@tanstack/react-query';

interface UpdateViewFieldWidthInput {
  viewId: string;
  fieldId: string;
  width: number;
}

export const useUpdateViewFieldWidthMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: UpdateViewFieldWidthInput) => {
      const { viewId, fieldId, width } = input;

      const query = workspace.schema
        .insertInto('node_attributes')
        .values({
          node_id: viewId,
          type: AttributeTypes.FieldWidth,
          key: '1',
          number_value: width,
          foreign_node_id: fieldId,
        })
        .onConflict((ob) =>
          ob.doUpdateSet({
            number_value: width,
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
