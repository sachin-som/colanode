import { useWorkspace } from '@/contexts/workspace';
import { NeuronId } from '@/lib/id';
import { useMutation } from '@tanstack/react-query';

interface UpdateNumberFieldValueMutationProps {
  recordId: string;
  fieldId: string;
  value: number | null;
}

export const useUpdateNumberFieldValueMutation = () => {
  const workspace = useWorkspace();
  return useMutation<void, Error, UpdateNumberFieldValueMutationProps>({
    mutationFn: async ({ recordId, fieldId, value }) => {
      if (value === null) {
        const query = workspace.schema
          .deleteFrom('node_attributes')
          .where((eb) =>
            eb.and({
              node_id: recordId,
              type: fieldId,
              key: '1',
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
          number_value: value,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .onConflict((ob) =>
          ob.doUpdateSet({
            number_value: value,
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
