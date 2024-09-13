import { useWorkspace } from '@/contexts/workspace';
import { AttributeTypes, NodeTypes, ViewNodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';

interface CalendarViewCreateInput {
  databaseId: string;
  name: string;
  groupBy: string;
}

export const useCalendarViewCreateMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: CalendarViewCreateInput) => {
      const siblingsQuery = workspace.schema
        .selectFrom('nodes')
        .where((eb) =>
          eb.and([
            eb('parent_id', '=', input.databaseId),
            eb('type', 'in', ViewNodeTypes),
          ]),
        )
        .selectAll()
        .compile();

      const result = await workspace.query(siblingsQuery);
      const siblings = result.rows;
      const maxIndex =
        siblings.length > 0
          ? siblings.sort((a, b) => compareString(a.index, b.index))[
              siblings.length - 1
            ].index
          : null;

      const calendarViewId = NeuronId.generate(NeuronId.Type.CalendarView);
      const insertCalendarViewQuery = workspace.schema
        .insertInto('nodes')
        .values({
          id: calendarViewId,
          type: NodeTypes.CalendarView,
          parent_id: input.databaseId,
          index: generateNodeIndex(maxIndex, null),
          content: null,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .compile();

      const insertCalendarViewAttributesQuery = workspace.schema
        .insertInto('node_attributes')
        .values([
          {
            node_id: calendarViewId,
            type: AttributeTypes.Name,
            key: '1',
            text_value: input.name,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
          {
            node_id: calendarViewId,
            type: AttributeTypes.GroupBy,
            key: '1',
            foreign_node_id: input.groupBy,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
        ])
        .compile();

      await workspace.mutate([
        insertCalendarViewQuery,
        insertCalendarViewAttributesQuery,
      ]);
      return calendarViewId;
    },
  });
};
