import { assetManager } from '@/main/asset-manager';
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
    const data = assetManager.getIconData();

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
