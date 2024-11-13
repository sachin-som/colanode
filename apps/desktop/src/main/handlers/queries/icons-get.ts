import { assetService } from '@/main/services/asset-service';
import {
  MutationChange,
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/main/types';
import { IconsGetQueryInput } from '@/operations/queries/icons-get';

export class IconsGetQueryHandler implements QueryHandler<IconsGetQueryInput> {
  public async handleQuery(
    _: IconsGetQueryInput
  ): Promise<QueryResult<IconsGetQueryInput>> {
    const data = assetService.getIconData();

    return {
      output: data,
      state: {},
    };
  }

  public async checkForChanges(
    _: MutationChange[],
    __: IconsGetQueryInput,
    ___: Record<string, any>
  ): Promise<ChangeCheckResult<IconsGetQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
