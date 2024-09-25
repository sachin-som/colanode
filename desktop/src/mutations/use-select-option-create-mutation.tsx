import { useWorkspace } from '@/contexts/workspace';
import { NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { buildNodeInsertMutation, generateNodeIndex } from '@/lib/nodes';
import { useMutation } from '@tanstack/react-query';

interface CreateSelectOptionInput {
  fieldId: string;
  name: string;
  color: string;
}

export const useSelectOptionCreateMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: CreateSelectOptionInput) => {
      const lastChildQuery = workspace.schema
        .selectFrom('nodes')
        .where((eb) =>
          eb.and({
            parent_id: input.fieldId,
            type: NodeTypes.SelectOption,
          }),
        )
        .selectAll()
        .orderBy('index', 'desc')
        .limit(1)
        .compile();

      const result = await workspace.query(lastChildQuery);
      const lastChild =
        result.rows && result.rows.length > 0 ? result.rows[0] : null;
      const maxIndex = lastChild?.index ? lastChild.index : null;

      const id = NeuronId.generate(NeuronId.Type.SelectOption);
      const query = buildNodeInsertMutation(
        workspace.schema,
        workspace.userId,
        {
          id: id,
          attributes: {
            type: NodeTypes.SelectOption,
            parentId: input.fieldId,
            index: generateNodeIndex(maxIndex, null),
            name: input.name,
            color: input.color,
          },
        },
      );

      await workspace.mutate(query);
      return id;
    },
  });
};
