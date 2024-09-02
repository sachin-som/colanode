import React from 'react';
import { Icon } from '@/components/ui/icon';
import { useMutation } from '@tanstack/react-query';
import { useWorkspace } from '@/contexts/workspace';
import { useDatabase } from '@/contexts/database';
import { generateNodeIndex } from '@/lib/nodes';
import { NeuronId } from '@/lib/id';
import { NodeTypes } from '@/lib/constants';

export const TableViewAddRecordRow = () => {
  const workspace = useWorkspace();
  const database = useDatabase();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const lastChildQuery = workspace.schema
        .selectFrom('nodes')
        .where('parent_id', '=', database.id)
        .selectAll()
        .orderBy('index', 'desc')
        .limit(1)
        .compile();

      const result = await workspace.query(lastChildQuery);
      const lastChild =
        result.rows && result.rows.length > 0 ? result.rows[0] : null;
      const maxIndex = lastChild?.index ? lastChild.index : null;

      const index = generateNodeIndex(maxIndex, null);
      const query = workspace.schema
        .insertInto('nodes')
        .values({
          id: NeuronId.generate(NeuronId.Type.Record),
          type: NodeTypes.Record,
          parent_id: database.id,
          index,
          attrs: null,
          content: null,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .compile();

      await workspace.mutate(query);
    },
  });

  return (
    <button
      type="button"
      disabled={isPending}
      className="animate-fade-in flex h-8 w-full cursor-pointer flex-row items-center gap-1 border-b pl-2 text-muted-foreground hover:bg-gray-50"
      onClick={() => {
        mutate();
      }}
    >
      <Icon name="add-line" />
      <span className="text-sm">Add record</span>
    </button>
  );
};
