import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { configuration } from '@/lib/configuration';
import { database } from '@/data/database';
import { addContextToChunk } from '@/services/llm-service';
import {
  DocumentContent,
  NodeAttributes,
  MessageAttributes,
  ChatAttributes,
  ChannelAttributes,
  RecordAttributes,
  DatabaseAttributes,
  extractBlockTexts,
} from '@colanode/core';

type BaseNodeMetadata = {
  id: string;
  type: string;
  attributes: NodeAttributes;
  createdAt: Date;
  createdBy: string;
  author?: { id: string; name: string };
};

type MessageNodeMetadata = BaseNodeMetadata & {
  nodeType: 'message';
  parentContext?: {
    type: 'chat' | 'channel';
    name?: string;
    collaborators?: Array<{ id: string; name: string }>;
  };
  referencedMessage?: {
    id: string;
    content: string;
    author?: { id: string; name: string };
  };
};

type ChatNodeMetadata = BaseNodeMetadata & {
  nodeType: 'chat';
  collaborators: Array<{ id: string; name: string }>;
};

type ChannelNodeMetadata = BaseNodeMetadata & {
  nodeType: 'channel';
  collaborators?: Array<{ id: string; name: string }>;
};

type RecordNodeMetadata = BaseNodeMetadata & {
  nodeType: 'record';
  databaseName?: string;
};

type DatabaseNodeMetadata = BaseNodeMetadata & {
  nodeType: 'database';
};

type PageNodeMetadata = BaseNodeMetadata & {
  nodeType: 'page';
  parentName?: string;
};

type FileNodeMetadata = BaseNodeMetadata & {
  nodeType: 'file';
};

type NodeMetadata = {
  type: 'node';
  node:
    | MessageNodeMetadata
    | ChatNodeMetadata
    | ChannelNodeMetadata
    | RecordNodeMetadata
    | DatabaseNodeMetadata
    | PageNodeMetadata
    | FileNodeMetadata;
};

type DocumentMetadata = {
  type: 'document';
  document: {
    id: string;
    content: DocumentContent;
    createdAt: Date;
    nodeType?: string;
    nodeName?: string;
    parentNodeName?: string;
  };
};

export type ChunkingMetadata = NodeMetadata | DocumentMetadata;

export class ChunkingService {
  public async chunkText(
    text: string,
    metadata?: { type: 'node' | 'document'; id: string }
  ): Promise<string[]> {
    const chunkSize = configuration.ai.chunking.defaultChunkSize;
    const chunkOverlap = configuration.ai.chunking.defaultOverlap;
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });
    const docs = await splitter.createDocuments([text]);
    let chunks = docs.map((doc) => doc.pageContent);
    chunks = chunks.filter((c) => c.trim().length > 10);
    if (configuration.ai.chunking.enhanceWithContext) {
      const enrichedMetadata = await this.fetchMetadata(metadata);
      const enriched: string[] = [];
      for (const chunk of chunks) {
        const c = await addContextToChunk(chunk, text, enrichedMetadata);
        enriched.push(c);
      }
      return enriched;
    }
    return chunks;
  }

  private async fetchMetadata(metadata?: {
    type: 'node' | 'document';
    id: string;
  }): Promise<ChunkingMetadata | undefined> {
    if (!metadata) {
      return undefined;
    }

    if (metadata.type === 'node') {
      const node = await database
        .selectFrom('nodes')
        .selectAll()
        .where('id', '=', metadata.id)
        .executeTakeFirst();
      if (!node) {
        return undefined;
      }

      const attributes = node.attributes as NodeAttributes;
      const author = await database
        .selectFrom('users')
        .select(['id', 'name'])
        .where('id', '=', node.created_by)
        .executeTakeFirst();

      const baseMetadata: BaseNodeMetadata = {
        id: node.id,
        type: attributes.type,
        attributes,
        createdAt: node.created_at,
        createdBy: node.created_by,
        author: author ?? undefined,
      };

      switch (attributes.type) {
        case 'message': {
          const messageMetadata: MessageNodeMetadata = {
            ...baseMetadata,
            nodeType: 'message',
          };

          // If message has a reference, fetch it
          if (attributes.referenceId) {
            const referencedNode = await database
              .selectFrom('nodes')
              .selectAll()
              .where('id', '=', attributes.referenceId)
              .executeTakeFirst();

            if (
              referencedNode &&
              referencedNode.attributes.type === 'message'
            ) {
              const refAttributes =
                referencedNode.attributes as MessageAttributes;
              const refAuthor = await database
                .selectFrom('users')
                .select(['id', 'name'])
                .where('id', '=', referencedNode.created_by)
                .executeTakeFirst();

              messageMetadata.referencedMessage = {
                id: referencedNode.id,
                content:
                  extractBlockTexts(referencedNode.id, refAttributes.content) ??
                  '',
                author: refAuthor ?? undefined,
              };
            }
          }

          // Get parent context (chat or channel) if available
          if (node.parent_id) {
            const parentNode = await database
              .selectFrom('nodes')
              .selectAll()
              .where('id', '=', node.parent_id)
              .executeTakeFirst();

            if (parentNode) {
              switch (parentNode.attributes.type) {
                case 'chat': {
                  const chatAttributes =
                    parentNode.attributes as ChatAttributes;
                  messageMetadata.parentContext = {
                    type: 'chat',
                  };

                  // Fetch chat collaborators
                  if (chatAttributes.collaborators) {
                    const collaborators = await database
                      .selectFrom('users')
                      .select(['id', 'name'])
                      .where(
                        'id',
                        'in',
                        Object.keys(chatAttributes.collaborators)
                      )
                      .execute();
                    messageMetadata.parentContext.collaborators = collaborators;
                  }
                  break;
                }
                case 'channel': {
                  const channelAttributes =
                    parentNode.attributes as ChannelAttributes;
                  messageMetadata.parentContext = {
                    type: 'channel',
                    name: channelAttributes.name,
                  };

                  // Fetch channel collaborators if they exist
                  if (
                    'collaborators' in channelAttributes &&
                    channelAttributes.collaborators
                  ) {
                    const collaborators = await database
                      .selectFrom('users')
                      .select(['id', 'name'])
                      .where(
                        'id',
                        'in',
                        Object.keys(channelAttributes.collaborators)
                      )
                      .execute();
                    messageMetadata.parentContext.collaborators = collaborators;
                  }
                  break;
                }
              }
            }
          }

          return { type: 'node', node: messageMetadata };
        }

        case 'chat': {
          const chatAttributes = attributes as ChatAttributes;
          let collaborators: Array<{ id: string; name: string }> = [];
          if (chatAttributes.collaborators) {
            collaborators = await database
              .selectFrom('users')
              .select(['id', 'name'])
              .where('id', 'in', Object.keys(chatAttributes.collaborators))
              .execute();
          }

          return {
            type: 'node',
            node: {
              ...baseMetadata,
              nodeType: 'chat',
              collaborators,
            },
          };
        }

        case 'channel': {
          const channelAttributes = attributes as ChannelAttributes;
          let collaborators: Array<{ id: string; name: string }> | undefined;

          // Only fetch collaborators if the channel has them
          if (
            'collaborators' in channelAttributes &&
            channelAttributes.collaborators
          ) {
            collaborators = await database
              .selectFrom('users')
              .select(['id', 'name'])
              .where('id', 'in', Object.keys(channelAttributes.collaborators))
              .execute();
          }

          return {
            type: 'node',
            node: {
              ...baseMetadata,
              nodeType: 'channel',
              collaborators,
            },
          };
        }

        case 'record': {
          const recordAttributes = attributes as RecordAttributes;
          const recordMetadata: RecordNodeMetadata = {
            ...baseMetadata,
            nodeType: 'record',
          };

          // Fetch database name
          const databaseNode = await database
            .selectFrom('nodes')
            .selectAll()
            .where('id', '=', recordAttributes.databaseId)
            .executeTakeFirst();

          if (databaseNode?.attributes.type === 'database') {
            const dbAttributes = databaseNode.attributes as DatabaseAttributes;
            recordMetadata.databaseName = dbAttributes.name;
          }

          return { type: 'node', node: recordMetadata };
        }

        case 'database': {
          return {
            type: 'node',
            node: {
              ...baseMetadata,
              nodeType: 'database',
            },
          };
        }

        case 'page': {
          const pageMetadata: PageNodeMetadata = {
            ...baseMetadata,
            nodeType: 'page',
          };

          // Get parent folder/space name for context
          if (node.parent_id) {
            const parentNode = await database
              .selectFrom('nodes')
              .selectAll()
              .where('id', '=', node.parent_id)
              .executeTakeFirst();

            if (parentNode && 'name' in parentNode.attributes) {
              pageMetadata.parentName = parentNode.attributes.name;
            }
          }

          return { type: 'node', node: pageMetadata };
        }

        case 'file': {
          return {
            type: 'node',
            node: {
              ...baseMetadata,
              nodeType: 'file',
            },
          };
        }

        default:
          return {
            type: 'node',
            node: {
              ...baseMetadata,
              nodeType: attributes.type as any,
            },
          };
      }
    } else {
      // For documents, fetch both document and its associated node
      const document = await database
        .selectFrom('documents')
        .selectAll()
        .where('id', '=', metadata.id)
        .executeTakeFirst();
      if (!document) {
        return undefined;
      }

      const documentMetadata: DocumentMetadata = {
        type: 'document',
        document: {
          id: document.id,
          content: document.content,
          createdAt: document.created_at,
        },
      };

      // Try to fetch associated node for additional context
      const node = await database
        .selectFrom('nodes')
        .selectAll()
        .where('id', '=', document.id)
        .executeTakeFirst();

      if (node) {
        documentMetadata.document.nodeType = node.attributes.type;
        if ('name' in node.attributes) {
          documentMetadata.document.nodeName = node.attributes.name;
        }

        if (node.parent_id) {
          const parentNode = await database
            .selectFrom('nodes')
            .selectAll()
            .where('id', '=', node.parent_id)
            .executeTakeFirst();

          if (parentNode && 'name' in parentNode.attributes) {
            documentMetadata.document.parentNodeName =
              parentNode.attributes.name;
          }
        }
      }

      return documentMetadata;
    }
  }
}
