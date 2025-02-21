import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { configuration } from '@/lib/configuration';
import { database } from '@/data/database';
import { getNodeModel, FieldAttributes } from '@colanode/core';
import type { SelectNode, SelectDocument } from '@/data/schema';
import { getNodeContextPrompt, documentContextPrompt } from '@/lib/llm-prompts';
import { BaseMetadata, NodeMetadata, DocumentMetadata } from '@/types/chunking';

async function buildBaseMetadata(
  node: SelectNode
): Promise<BaseMetadata | undefined> {
  const nodeModel = getNodeModel(node.attributes.type);
  if (!nodeModel) return undefined;
  const nodeText = nodeModel.extractNodeText(node.id, node.attributes);
  if (!nodeText) return undefined;

  const author = await database
    .selectFrom('users')
    .select(['id', 'name'])
    .where('id', '=', node.created_by)
    .executeTakeFirst();
  const lastAuthor = node.updated_by
    ? await database
        .selectFrom('users')
        .select(['id', 'name'])
        .where('id', '=', node.updated_by)
        .executeTakeFirst()
    : undefined;
  const workspace = await database
    .selectFrom('workspaces')
    .select(['id', 'name'])
    .where('id', '=', node.workspace_id)
    .executeTakeFirst();

  return {
    id: node.id,
    name: nodeText.name ?? node.attributes.type,
    createdAt: node.created_at,
    createdBy: node.created_by,
    updatedAt: node.updated_at,
    updatedBy: node.updated_by,
    author,
    lastAuthor,
    workspace,
  };
}

async function buildParentContext(
  node: SelectNode
): Promise<BaseMetadata['parentContext'] | undefined> {
  const parentNode = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', node.parent_id)
    .executeTakeFirst();
  if (!parentNode) return undefined;

  const parentModel = getNodeModel(parentNode.attributes.type);
  if (!parentModel) return undefined;
  const parentText = parentModel.extractNodeText(
    parentNode.id,
    parentNode.attributes
  );

  const pathNodes = await database
    .selectFrom('node_paths')
    .innerJoin('nodes', 'nodes.id', 'node_paths.ancestor_id')
    .select(['nodes.id', 'nodes.attributes'])
    .where('node_paths.descendant_id', '=', node.id)
    .orderBy('node_paths.level', 'desc')
    .execute();
  const path = pathNodes
    .map((n) => {
      const model = getNodeModel(n.attributes.type);
      return model?.extractNodeText(n.id, n.attributes)?.name ?? '';
    })
    .join(' / ');
  return {
    id: parentNode.id,
    type: parentNode.attributes.type,
    name: parentText?.name ?? undefined,
    path,
  };
}

async function fetchCollaborators(
  collaboratorIds: string[]
): Promise<Array<{ id: string; name: string }>> {
  if (!collaboratorIds.length) return [];
  const collaborators = await database
    .selectFrom('users')
    .select(['id', 'name'])
    .where('id', 'in', collaboratorIds)
    .execute();
  return collaborators.map((c) => ({ id: c.id, name: c.name }));
}

async function buildNodeMetadata(
  node: SelectNode
): Promise<NodeMetadata | undefined> {
  const nodeModel = getNodeModel(node.attributes.type);
  if (!nodeModel) return undefined;
  const baseMetadata = await buildBaseMetadata(node);
  if (!baseMetadata) return undefined;

  if ('collaborators' in node.attributes) {
    baseMetadata.collaborators = await fetchCollaborators(
      Object.keys(node.attributes.collaborators)
    );
  }
  if (node.parent_id) {
    const parentContext = await buildParentContext(node);
    if (parentContext) baseMetadata.parentContext = parentContext;
  }
  let fieldInfo: Record<string, { type: string; name: string }> | undefined;
  if (node.attributes.type === 'record') {
    const databaseNode = await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', node.attributes.databaseId)
      .executeTakeFirst();
    if (databaseNode?.attributes.type === 'database') {
      fieldInfo = Object.entries(databaseNode.attributes.fields).reduce(
        (acc, [fieldId, field]) => ({
          ...acc,
          [fieldId]: {
            type: (field as FieldAttributes).type,
            name: (field as FieldAttributes).name,
          },
        }),
        {} as Record<string, { type: string; name: string }>
      );
    }
  }
  return {
    type: 'node',
    nodeType: node.attributes.type,
    fieldInfo,
    ...baseMetadata,
  };
}

async function buildDocumentMetadata(
  document: SelectDocument,
  node?: SelectNode
): Promise<DocumentMetadata | undefined> {
  if (!node) return undefined;
  const baseMetadata: BaseMetadata = {
    id: document.id,
    createdAt: document.created_at,
    createdBy: document.created_by,
  };
  const nodeModel = getNodeModel(node.attributes.type);
  if (nodeModel) {
    const nodeText = nodeModel.extractNodeText(node.id, node.attributes);
    if (nodeText) baseMetadata.name = nodeText.name;
    if (node.parent_id) {
      const parentContext = await buildParentContext(node);
      if (parentContext) baseMetadata.parentContext = parentContext;
    }
  }
  return { type: 'document', ...baseMetadata };
}

async function fetchMetadata(metadata?: {
  type: 'node' | 'document';
  node: SelectNode;
}): Promise<NodeMetadata | DocumentMetadata | undefined> {
  if (!metadata) return undefined;
  if (metadata.type === 'node') {
    return buildNodeMetadata(metadata.node);
  } else {
    const document = await database
      .selectFrom('documents')
      .selectAll()
      .where('id', '=', metadata.node.id)
      .executeTakeFirst();
    if (!document) return undefined;
    return buildDocumentMetadata(document, metadata.node);
  }
}

export async function prepareEnrichmentPrompt(
  chunk: string,
  fullText: string,
  metadata: NodeMetadata | DocumentMetadata
): Promise<{ prompt: string; baseVars: Record<string, string> }> {
  const formatDate = (date?: Date) =>
    date ? new Date(date).toUTCString() : 'unknown';

  const baseVars: Record<string, string> = {
    nodeType:
      metadata.type === 'node'
        ? (metadata as NodeMetadata).nodeType
        : metadata.type,
    name: metadata.name ?? 'Untitled',
    createdAt: formatDate(metadata.createdAt),
    updatedAt: metadata.updatedAt ? formatDate(metadata.updatedAt) : '',
    authorName: metadata.author?.name ?? 'Unknown',
    lastAuthorName: metadata.lastAuthor?.name ?? '',
    path: metadata.parentContext?.path ?? '',
    workspaceName: metadata.workspace?.name ?? 'Unknown Workspace',
    fullText,
    chunk,
  };

  let prompt: string;
  if (metadata.type === 'node') {
    prompt = getNodeContextPrompt(metadata as NodeMetadata);
  } else {
    prompt = documentContextPrompt.template.toString();
  }
  Object.entries(baseVars).forEach(([key, value]) => {
    prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value);
  });

  return { prompt, baseVars };
}

export async function chunkText(
  text: string,
  metadata?: { type: 'node' | 'document'; node: SelectNode },
  enrichFn?: (
    prompt: string,
    baseVars: Record<string, string>
  ) => Promise<string>
): Promise<string[]> {
  const chunkSize = configuration.ai.chunking.defaultChunkSize;
  const chunkOverlap = configuration.ai.chunking.defaultOverlap;
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });
  const docs = await splitter.createDocuments([text]);
  let chunks = docs
    .map((doc) => doc.pageContent)
    .filter((c) => c.trim().length > 5);

  if (configuration.ai.chunking.enhanceWithContext && enrichFn && metadata) {
    const enriched: string[] = [];
    const enrichedMetadata = await fetchMetadata(metadata);
    if (!enrichedMetadata) {
      return chunks;
    }
    for (const chunk of chunks) {
      const { prompt } = await prepareEnrichmentPrompt(
        chunk,
        text,
        enrichedMetadata
      );

      const enrichment = await enrichFn(prompt, {});
      enriched.push(enrichment + '\n\n' + chunk);
    }
    return enriched;
  }
  return chunks;
}
