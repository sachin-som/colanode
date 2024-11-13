import { radarService } from '@/main/services/radar-service';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { ReadStatesGetQueryInput } from '@/shared/queries/read-states-get';
import { WorkspaceReadState } from '@/shared/types/radars';
import { Event } from '@/shared/types/events';

export class ReadStatesGetQueryHandler
  implements QueryHandler<ReadStatesGetQueryInput>
{
  public async handleQuery(
    _: ReadStatesGetQueryInput
  ): Promise<Record<string, WorkspaceReadState>> {
    const data = radarService.getWorkspaceStates();
    return data;
  }

  public async checkForChanges(
    event: Event,
    _: ReadStatesGetQueryInput,
    ___: Record<string, WorkspaceReadState>
  ): Promise<ChangeCheckResult<ReadStatesGetQueryInput>> {
    if (
      event.type === 'node_created' ||
      event.type === 'node_updated' ||
      event.type === 'node_deleted' ||
      event.type === 'user_node_created'
    ) {
      const data = radarService.getWorkspaceStates();
      return {
        hasChanges: true,
        result: data,
      };
    }

    return {
      hasChanges: false,
    };
  }
}
