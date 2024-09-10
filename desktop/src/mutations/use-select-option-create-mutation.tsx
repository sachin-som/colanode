import { useWorkspace } from '@/contexts/workspace';
import { AttributeTypes, NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
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

      const selectOptionId = NeuronId.generate(NeuronId.Type.SelectOption);
      const insertSelectOptionQuery = workspace.schema
        .insertInto('nodes')
        .values({
          id: selectOptionId,
          type: NodeTypes.SelectOption,
          parent_id: input.fieldId,
          index: generateNodeIndex(maxIndex, null),
          content: null,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .compile();

      const insertSelectOptionAttributesQuery = workspace.schema
        .insertInto('node_attributes')
        .values([
          {
            node_id: selectOptionId,
            type: AttributeTypes.Name,
            key: '1',
            text_value: input.name,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
          {
            node_id: selectOptionId,
            type: AttributeTypes.Color,
            key: '1',
            text_value: input.color,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
        ])
        .compile();

      await workspace.mutate([
        insertSelectOptionQuery,
        insertSelectOptionAttributesQuery,
      ]);
      return selectOptionId;
    },
  });
};
