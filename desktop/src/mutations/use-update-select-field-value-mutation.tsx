import { useWorkspace } from '@/contexts/workspace';
import { NeuronId } from '@/lib/id';
import { useMutation } from '@tanstack/react-query';

interface UpdateSelectFieldValueMutationProps {
  recordId: string;
  fieldId: string;
  selectOptionId: string;
  add: boolean;
}

export const useUpdateSelectFieldValueMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async ({
      recordId,
      fieldId,
      selectOptionId,
      add,
    }: UpdateSelectFieldValueMutationProps) => {
      if (add) {
        const query = workspace.schema
          .insertInto('node_attributes')
          .values({
            node_id: recordId,
            type: fieldId,
            key: '1',
            foreign_node_id: selectOptionId,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          })
          .onConflict((ob) =>
            ob.doUpdateSet({
              foreign_node_id: selectOptionId,
              updated_at: new Date().toISOString(),
              updated_by: workspace.userId,
              version_id: NeuronId.generate(NeuronId.Type.Version),
            }),
          )
          .compile();

        await workspace.mutate(query);
      } else {
        const query = workspace.schema
          .deleteFrom('node_attributes')
          .where((eb) =>
            eb.and([
              eb('node_id', '=', recordId),
              eb('type', '=', fieldId),
              eb('key', '=', '1'),
            ]),
          )
          .compile();

        await workspace.mutate(query);
      }
    },
  });
};
