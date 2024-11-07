import { MutationInput, MutationMap } from '@/operations/mutations';
import { MutationChange, MutationHandler } from '@/main/types';
import { mutationHandlerMap } from '@/main/handlers/mutations';
import { QueryInput, QueryMap } from '@/operations/queries';
import { QueryHandler, SubscribedQuery } from '@/main/types';
import { queryHandlerMap } from '@/main/handlers/queries';
import { eventBus } from '@/lib/event-bus';
import {
  MessageContext,
  MessageHandler,
  MessageInput,
} from '@/operations/messages';
import { messageHandlerMap } from '@/main/handlers/messages';

class Mediator {
  private readonly subscribedQueries: Map<string, SubscribedQuery<QueryInput>> =
    new Map();

  public async executeMutation<T extends MutationInput>(
    input: T
  ): Promise<MutationMap[T['type']]['output']> {
    const handler = mutationHandlerMap[
      input.type
    ] as unknown as MutationHandler<T>;
    const result = await handler.handleMutation(input);

    if (result.changes) {
      await this.checkForQueryChanges(result.changes);
    }

    return result.output;
  }

  public async executeQuery<T extends QueryInput>(
    input: T
  ): Promise<QueryMap[T['type']]['output']> {
    const handler = queryHandlerMap[input.type] as unknown as QueryHandler<T>;
    const result = await handler.handleQuery(input);
    return result.output;
  }

  public async executeQueryAndSubscribe<T extends QueryInput>(
    id: string,
    input: T
  ): Promise<QueryMap[T['type']]['output']> {
    const handler = queryHandlerMap[input.type] as unknown as QueryHandler<T>;
    const result = await handler.handleQuery(input);
    this.subscribedQueries.set(id, {
      input,
      result,
    });
    return result.output;
  }

  public async executeMessage<T extends MessageInput>(
    context: MessageContext,
    input: T
  ): Promise<void> {
    const handler = messageHandlerMap[input.type] as MessageHandler<T>;
    await handler.handleMessage(context, input);
  }

  public unsubscribeQuery(id: string) {
    this.subscribedQueries.delete(id);
  }

  public async checkForQueryChanges(changes: MutationChange[]): Promise<void> {
    if (changes.length === 0) {
      return;
    }

    for (const [id, query] of this.subscribedQueries) {
      const handler = queryHandlerMap[query.input.type] as QueryHandler<
        typeof query.input
      >;

      const changeCheckResult = await handler.checkForChanges(
        changes,
        query.input,
        query.result.state
      );
      if (changeCheckResult.hasChanges && changeCheckResult.result) {
        const newResult = changeCheckResult.result;
        this.subscribedQueries.set(id, {
          input: query.input,
          result: newResult,
        });

        eventBus.publish({
          event: 'query_result_updated',
          payload: {
            id: id,
            result: newResult.output,
          },
        });
      }
    }
  }
}

export const mediator = new Mediator();
