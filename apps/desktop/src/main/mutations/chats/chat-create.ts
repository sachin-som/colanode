import { ChatAttributes, generateId, IdType } from '@colanode/core';
import { sql } from 'kysely';

import { databaseService } from '@/main/data/database-service';
import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import {
  ChatCreateMutationInput,
  ChatCreateMutationOutput,
} from '@/shared/mutations/chats/chat-create';

interface ChatRow {
  id: string;
}

export class ChatCreateMutationHandler
  implements MutationHandler<ChatCreateMutationInput>
{
  public async handleMutation(
    input: ChatCreateMutationInput
  ): Promise<ChatCreateMutationOutput> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const query = sql<ChatRow>`
      SELECT id
      FROM entries
      WHERE type = 'chat'
      AND json_extract(attributes, '$.collaborators.${sql.raw(input.userId)}') is not null
      AND json_extract(attributes, '$.collaborators.${sql.raw(input.otherUserId)}') is not null
    `.compile(workspaceDatabase);

    const existingChats = await workspaceDatabase.executeQuery(query);
    const chat = existingChats.rows?.[0];
    if (chat) {
      return {
        id: chat.id,
      };
    }

    const id = generateId(IdType.Chat);
    const attributes: ChatAttributes = {
      type: 'chat',
      collaborators: {
        [input.userId]: 'admin',
        [input.otherUserId]: 'admin',
      },
    };

    await entryService.createEntry(input.userId, {
      id,
      attributes,
      parentId: null,
    });

    return {
      id,
    };
  }
}
