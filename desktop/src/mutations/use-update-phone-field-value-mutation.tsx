import { useWorkspace } from '@/contexts/workspace';
import { NeuronId } from '@/lib/id';
import { useMutation } from '@tanstack/react-query';

interface UpdatePhoneFieldValueMutationProps {
  recordId: string;
  fieldId: string;
  value: string;
}

export const useUpdatePhoneFieldValueMutation = () => {
  const workspace = useWorkspace();
  return useMutation<void, Error, UpdatePhoneFieldValueMutationProps>({
    mutationFn: async ({ recordId, fieldId, value }) => {
      if (value.length === 0) {
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
          text_value: value,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .onConflict((ob) =>
          ob.doUpdateSet({
            text_value: value,
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
