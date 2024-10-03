import {
  MutationChange,
  MutationHandler,
  MutationInput,
  MutationMap,
} from '@/types/mutations';
import { mutationHandlerMap } from '@/main/mutations';
import {
  QueryHandler,
  QueryInput,
  QueryMap,
  SubscribedQuery,
} from '@/types/queries';
import { queryHandlerMap } from '@/main/queries';
import { eventBus } from '@/lib/event-bus';

class Mediator {
  private readonly subscribedQueries: Map<string, SubscribedQuery<QueryInput>> =
    new Map();

  public async executeMutation<T extends MutationInput>(
    input: T,
  ): Promise<MutationMap[T['type']]['output']> {
    const handler = mutationHandlerMap[input.type] as MutationHandler<T>;
    const result = await handler.handleMutation(input);

    if (result.changedTables) {
      await this.checkForQueryChanges(result.changedTables);
    }

    return result.output;
  }

  public async executeQuery<T extends QueryInput>(
    input: T,
  ): Promise<QueryMap[T['type']]['output']> {
    const handler = queryHandlerMap[input.type] as QueryHandler<T>;
    const result = await handler.handleQuery(input);
    return result.output;
  }

  public async executeQueryAndSubscribe<T extends QueryInput>(
    id: string,
    input: T,
  ): Promise<QueryMap[T['type']]['output']> {
    const handler = queryHandlerMap[input.type] as QueryHandler<T>;
    const result = await handler.handleQuery(input);
    this.subscribedQueries.set(id, {
      input,
      result,
    });
    return result.output;
  }

  public unsubscribeQuery(id: string) {
    this.subscribedQueries.delete(id);
  }

  private async checkForQueryChanges(changes: MutationChange[]): Promise<void> {
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
        query.result.state,
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
