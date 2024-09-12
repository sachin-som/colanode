import { useWorkspace } from '@/contexts/workspace';
import { AttributeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { useMutation } from '@tanstack/react-query';

interface ViewFilterOperatorUpdateMutationInput {
  filterId: string;
  operator: string;
}

export const useViewFilterOperatorUpdateMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async ({
      filterId,
      operator,
    }: ViewFilterOperatorUpdateMutationInput) => {
      const query = workspace.schema
        .insertInto('node_attributes')
        .values({
          node_id: filterId,
          type: AttributeTypes.Operator,
          key: '1',
          text_value: operator,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .onConflict((b) =>
          b.doUpdateSet({
            text_value: operator,
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
