import { database } from '@/data/database';
import { MessageContext } from '@/messages';
import { sql } from 'kysely';

export type ServerChangeAckMessageInput = {
  type: 'server_change_ack';
  changeId: string;
};

declare module '@/messages' {
  interface MessageMap {
    server_change_ack: ServerChangeAckMessageInput;
  }
}

export const handleChangeAck = async (
  context: MessageContext,
  input: ServerChangeAckMessageInput,
) => {
  await database
    .updateTable('changes')
    .set({
      device_ids: sql`array_remove(device_ids, ${context.deviceId})`,
    })
    .where('id', '=', input.changeId)
    .execute();
};
