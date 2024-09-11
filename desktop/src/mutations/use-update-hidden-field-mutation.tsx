import { useWorkspace } from '@/contexts/workspace';
import { AttributeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { useMutation } from '@tanstack/react-query';

interface UpdateHiddenFieldInput {
  viewId: string;
  fieldId: string;
  hide: boolean;
}

export const useUpdateViewHiddenFieldMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: UpdateHiddenFieldInput) => {
      const { viewId, fieldId, hide } = input;

      if (!hide) {
        const query = workspace.schema
          .deleteFrom('node_attributes')
          .where((eb) =>
            eb.and({
              node_id: viewId,
              type: AttributeTypes.HiddenField,
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
          node_id: viewId,
          type: AttributeTypes.HiddenField,
          key: fieldId,
          text_value: fieldId,
          foreign_node_id: fieldId,
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
