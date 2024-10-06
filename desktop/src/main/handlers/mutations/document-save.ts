import * as Y from 'yjs';
import { CompiledQuery, sql } from 'kysely';
import { fromUint8Array, toUint8Array } from 'js-base64';
import { isEqual } from 'lodash';
import { NodeTypes } from '@/lib/constants';
import { mapNode } from '@/lib/nodes';
import { databaseManager } from '@/main/data/database-manager';
import { EditorNode } from '@/types/editor';
import { SelectNode } from '@/main/data/workspace/schema';
import {
  MutationChange,
  MutationHandler,
  MutationResult,
} from '@/operations/mutations';
import { DocumentSaveMutationInput } from '@/operations/mutations/document-save';
import { LocalNode } from '@/types/nodes';
import { generateId, IdType } from '@/lib/id';
import { mapContentsToEditorNodes } from '@/lib/editor';

export class DocumentSaveMutationHandler
  implements MutationHandler<DocumentSaveMutationInput>
{
  async handleMutation(
    input: DocumentSaveMutationInput,
  ): Promise<MutationResult<DocumentSaveMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const query = sql<SelectNode>`
      WITH RECURSIVE document_nodes AS (
          SELECT *
          FROM nodes
          WHERE parent_id = ${input.documentId}
          
          UNION ALL
          
          SELECT child.*
          FROM nodes child
          INNER JOIN document_nodes parent ON child.parent_id = parent.id
          WHERE parent.type NOT IN (${NodeTypes.Page})
      )
      SELECT *
      FROM document_nodes
    `.compile(workspaceDatabase);

    const result = await workspaceDatabase.executeQuery(query);
    const nodes = result.rows;
    const map = new Map<string, LocalNode>();
    nodes.forEach((node) => {
      map.set(node.id, mapNode(node));
    });

    const editorNodes = mapContentsToEditorNodes(
      input.content.content,
      input.documentId,
      map,
    );

    const editorNodesMap = new Map<string, EditorNode>();
    for (const node of editorNodes) {
      editorNodesMap.set(node.id, node);
    }

    const allNodeIds = new Set([
      ...map.keys(),
      ...editorNodes.map((node) => node.id),
    ]);

    const insertQueries: CompiledQuery[] = [];
    const updateQueries: CompiledQuery[] = [];
    const deleteQueries: CompiledQuery[] = [];

    for (const nodeId of allNodeIds) {
      const existingNode = map.get(nodeId);
      const editorNode = editorNodesMap.get(nodeId);

      if (!existingNode) {
        const doc = new Y.Doc({
          guid: editorNode.id,
        });

        const attributesMap = doc.getMap('attributes');

        doc.transact(() => {
          for (const [key, value] of Object.entries(editorNode.attributes)) {
            if (value !== undefined) {
              attributesMap.set(key, value);
            }
          }
        });

        const attributes = attributesMap.toJSON();
        const state = fromUint8Array(Y.encodeStateAsUpdate(doc));

        const newNode: LocalNode = {
          id: editorNode.id,
          type: editorNode.attributes.type,
          parentId: editorNode.attributes.parentId,
          index: editorNode.attributes.index,
          attributes: editorNode.attributes,
          state: state,
          createdAt: new Date().toISOString(),
          createdBy: input.userId,
          versionId: generateId(IdType.Version),
          updatedAt: null,
          updatedBy: null,
          serverCreatedAt: null,
          serverUpdatedAt: null,
          serverVersionId: null,
        };

        const insertNodeQuery = workspaceDatabase
          .insertInto('nodes')
          .values({
            id: editorNode.id,
            attributes: JSON.stringify(attributes),
            state: state,
            created_at: new Date().toISOString(),
            created_by: input.userId,
            version_id: generateId(IdType.Version),
          })
          .compile();

        insertQueries.push(insertNodeQuery);
      } else if (!editorNode) {
        const query = workspaceDatabase
          .deleteFrom('nodes')
          .where('id', '=', existingNode.id)
          .compile();

        deleteQueries.push(query);
      } else {
        if (!isEqual(existingNode.attributes, editorNode.attributes)) {
          const doc = new Y.Doc({
            guid: existingNode.id,
          });

          Y.applyUpdate(doc, toUint8Array(existingNode.state));
          const attributesMap = doc.getMap('attributes');

          let hasChanges = false;
          doc.transact(() => {
            if (existingNode.attributes.type !== editorNode.attributes.type) {
              attributesMap.set('type', editorNode.attributes.type);
              hasChanges = true;
            }

            if (
              existingNode.attributes.parentId !==
              editorNode.attributes.parentId
            ) {
              attributesMap.set('parentId', editorNode.attributes.parentId);
              hasChanges = true;
            }

            if (existingNode.attributes.index !== editorNode.attributes.index) {
              attributesMap.set('index', editorNode.attributes.index);
              hasChanges = true;
            }

            if (
              !isEqual(
                existingNode.attributes.content,
                editorNode.attributes.content,
              )
            ) {
              attributesMap.set('content', editorNode.attributes.content);
              hasChanges = true;
            }

            for (const [key, value] of Object.entries(editorNode.attributes)) {
              const existingValue = attributesMap.get(key);
              if (!isEqual(existingValue, value)) {
                attributesMap.set(key, value);
                hasChanges = true;
              }
            }

            const existingAttributes = existingNode.attributes;
            const editorAttributes = editorNode.attributes;
            for (const key of Object.keys(existingAttributes)) {
              if (!(key in editorAttributes)) {
                attributesMap.delete(key);
                hasChanges = true;
              }
            }
          });

          if (!hasChanges) {
            continue;
          }

          const attributes = attributesMap.toJSON();
          const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

          existingNode.type = editorNode.attributes.type;
          existingNode.parentId = editorNode.attributes.parentId;
          existingNode.index = editorNode.attributes.index;
          existingNode.attributes = editorNode.attributes;
          existingNode.updatedAt = new Date().toISOString();
          existingNode.updatedBy = input.userId;
          existingNode.versionId = generateId(IdType.Version);

          const query = workspaceDatabase
            .updateTable('nodes')
            .set({
              attributes: JSON.stringify(attributes),
              state: encodedState,
              updated_at: existingNode.updatedAt,
              updated_by: existingNode.updatedBy,
              version_id: existingNode.versionId,
            })
            .where('id', '=', existingNode.id)
            .compile();

          updateQueries.push(query);
        }
      }
    }

    const hasChanges =
      insertQueries.length > 0 ||
      updateQueries.length > 0 ||
      deleteQueries.length > 0;

    if (hasChanges) {
      await workspaceDatabase.transaction().execute(async (trx) => {
        for (const query of insertQueries) {
          await trx.executeQuery(query);
        }

        for (const query of updateQueries) {
          await trx.executeQuery(query);
        }

        for (const query of deleteQueries) {
          await trx.executeQuery(query);
        }
      });
    }

    const changes: MutationChange[] = hasChanges
      ? [
          {
            type: 'workspace',
            table: 'nodes',
            userId: input.userId,
          },
        ]
      : [];

    return {
      output: {
        success: true,
      },
      changes: changes,
    };
  }
}
