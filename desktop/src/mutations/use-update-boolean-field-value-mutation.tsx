import { useWorkspace } from '@/contexts/workspace';
import { NeuronId } from '@/lib/id';
import { useMutation } from '@tanstack/react-query';

interface UpdateBooleanFieldValueMutationProps {
  recordId: string;
  fieldId: string;
  value: boolean;
}

export const useUpdateBooleanFieldValueMutation = () => {
  const workspace = useWorkspace();
  return useMutation<void, Error, UpdateBooleanFieldValueMutationProps>({
    mutationFn: async ({ recordId, fieldId, value }) => {
      if (!value) {
        const query = workspace.schema
          .deleteFrom('node_attributes')
          .where((eb) =>
            eb.and({
              node_id: recordId,
              type: fieldId,
              key: fieldId,
            }),
          )
          .compile();

        await workspace.mutate(query);
        return;
      }

      const query = workspace.schema
        .insertInto('node_attributes')
        .values({
          node_id: recordId,
          type: fieldId,
          key: '1',
          number_value: 1,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .onConflict((ob) => ob.doNothing())
        .compile();

      await workspace.mutate(query);
    },
  });
};
