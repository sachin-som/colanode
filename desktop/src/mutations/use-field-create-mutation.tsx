import { useWorkspace } from '@/contexts/workspace';
import { NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { buildNodeInsertMutation, generateNodeIndex } from '@/lib/nodes';
import { useMutation } from '@tanstack/react-query';

interface FieldCreateMutationInput {
  databaseId: string;
  name: string;
  dataType: string;
}

export const useFieldCreateMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (values: FieldCreateMutationInput) => {
      const lastFieldQuery = workspace.schema
        .selectFrom('nodes')
        .where((eb) =>
          eb.and({
            parent_id: values.databaseId,
            type: NodeTypes.Field,
          }),
        )
        .selectAll()
        .orderBy('index', 'desc')
        .limit(1)
        .compile();

      const result = await workspace.query(lastFieldQuery);
      const lastChild =
        result.rows && result.rows.length > 0 ? result.rows[0] : null;
      const maxIndex = lastChild?.index ? lastChild.index : null;

      const id = NeuronId.generate(NeuronId.Type.Field);
      const query = buildNodeInsertMutation(
        workspace.schema,
        workspace.userId,
        {
          id: id,
          attributes: {
            type: NodeTypes.Field,
            parentId: values.databaseId,
            index: generateNodeIndex(maxIndex, null),
            name: values.name,
            dataType: values.dataType,
          },
        },
      );

      await workspace.mutate(query);
      return id;
    },
  });
};
