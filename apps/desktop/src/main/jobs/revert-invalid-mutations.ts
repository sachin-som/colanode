import { entryService } from '@/main/services/entry-service';
import { fileService } from '@/main/services/file-service';
import { messageService } from '@/main/services/message-service';
import { createDebugger } from '@/main/debugger';
import { databaseService } from '@/main/data/database-service';
import { JobHandler } from '@/main/jobs';
import { mapMutation } from '@/main/utils';

export type RevertInvalidMutationsInput = {
  type: 'revert_invalid_mutations';
  userId: string;
};

declare module '@/main/jobs' {
  interface JobMap {
    revert_invalid_mutations: {
      input: RevertInvalidMutationsInput;
    };
  }
}

export class RevertInvalidMutationsJobHandler
  implements JobHandler<RevertInvalidMutationsInput>
{
  public triggerDebounce = 100;
  public interval = 1000 * 60 * 5;

  private readonly debug = createDebugger('job:revert-invalid-mutations');

  public async handleJob(input: RevertInvalidMutationsInput) {
    this.debug(`Reverting invalid mutations for user ${input.userId}`);

    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const invalidMutations = await workspaceDatabase
      .selectFrom('mutations')
      .selectAll()
      .where('retries', '>=', 10)
      .execute();

    if (invalidMutations.length === 0) {
      this.debug(
        `No invalid mutations found for user ${input.userId}, skipping`
      );
      return;
    }

    for (const mutationRow of invalidMutations) {
      const mutation = mapMutation(mutationRow);

      if (mutation.type === 'create_file') {
        await fileService.revertFileCreation(input.userId, mutation.id);
      } else if (mutation.type === 'delete_file') {
        await fileService.revertFileDeletion(input.userId, mutation.id);
      } else if (mutation.type === 'apply_create_transaction') {
        await entryService.revertCreateTransaction(input.userId, mutation.data);
      } else if (mutation.type === 'apply_update_transaction') {
        await entryService.revertUpdateTransaction(input.userId, mutation.data);
      } else if (mutation.type === 'apply_delete_transaction') {
        await entryService.revertDeleteTransaction(input.userId, mutation.data);
      } else if (mutation.type === 'create_message') {
        await messageService.revertMessageCreation(
          input.userId,
          mutation.data.id
        );
      } else if (mutation.type === 'delete_message') {
        await messageService.revertMessageDeletion(
          input.userId,
          mutation.data.id
        );
      } else if (mutation.type === 'create_message_reaction') {
        await messageService.revertMessageReactionCreation(
          input.userId,
          mutation.data
        );
      } else if (mutation.type === 'delete_message_reaction') {
        await messageService.revertMessageReactionDeletion(
          input.userId,
          mutation.data
        );
      }
    }

    const mutationIds = invalidMutations.map((m) => m.id);

    await workspaceDatabase
      .deleteFrom('mutations')
      .where('id', 'in', mutationIds)
      .execute();
  }
}
