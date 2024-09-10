import { useWorkspace } from '@/contexts/workspace';
import { AttributeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { useMutation } from '@tanstack/react-query';

interface UpdateViewNameWidthInput {
  viewId: string;
  width: number;
}

export const useUpdateViewNameWidthMutation = () => {
  const workspace = useWorkspace();
  return useMutation({
    mutationFn: async (input: UpdateViewNameWidthInput) => {
      const { viewId, width } = input;

      const query = workspace.schema
        .insertInto('node_attributes')
        .values({
          node_id: viewId,
          type: AttributeTypes.NameWidth,
          key: '1',
          number_value: width,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
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
