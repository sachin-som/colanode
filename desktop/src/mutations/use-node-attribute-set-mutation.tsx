import { useWorkspace } from '@/contexts/workspace';
import { NeuronId } from '@/lib/id';
import { useMutation } from '@tanstack/react-query';
import { fromUint8Array, toUint8Array } from 'js-base64';
import * as Y from 'yjs';

interface NodeAttributeSetInput {
  nodeId: string;
  key: string;
  value: any;
}

export const useNodeAttributeSetMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: NodeAttributeSetInput) => {
      const selectQuery = workspace.schema
        .selectFrom('nodes')
        .where('id', '=', input.nodeId)
        .selectAll()
        .compile();

      const result = await workspace.query(selectQuery);
      if (result.rows.length === 0) {
        throw new Error('Node not found');
      }

      const node = result.rows[0];
      const doc = new Y.Doc({
        guid: node.id,
      });

      Y.applyUpdate(doc, toUint8Array(node.state));

      const attributesMap = doc.getMap('attributes');
      attributesMap.set(input.key, input.value);

      const attributes = JSON.stringify(attributesMap.toJSON());
      const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

      const updateQuery = workspace.schema
        .updateTable('nodes')
        .set({
          state: encodedState,
          attributes: attributes,
          updated_at: new Date().toISOString(),
          updated_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .where('id', '=', input.nodeId)
        .compile();

      await workspace.mutate(updateQuery);
    },
  });
};
