import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { mapAccountMetadata } from '@/main/lib/mappers';
import { AccountMetadataListQueryInput } from '@/shared/queries/accounts/account-metadata-list';
import { Event } from '@/shared/types/events';
import { AccountMetadata } from '@/shared/types/accounts';
import { SelectAccountMetadata } from '@/main/databases/account/schema';
import { appService } from '@/main/services/app-service';

export class AccountMetadataListQueryHandler
  implements QueryHandler<AccountMetadataListQueryInput>
{
  public async handleQuery(
    input: AccountMetadataListQueryInput
  ): Promise<AccountMetadata[]> {
    const rows = await this.getAccountMetadata(input.accountId);
    if (!rows) {
      return [];
    }

    return rows.map(mapAccountMetadata);
  }

  public async checkForChanges(
    event: Event,
    input: AccountMetadataListQueryInput,
    output: AccountMetadata[]
  ): Promise<ChangeCheckResult<AccountMetadataListQueryInput>> {
    if (
      event.type === 'account_created' &&
      event.account.id === input.accountId
    ) {
      const result = await this.handleQuery(input);
      return {
        hasChanges: true,
        result,
      };
    }

    if (
      event.type === 'account_deleted' &&
      event.account.id === input.accountId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'account_metadata_saved' &&
      event.accountId === input.accountId
    ) {
      const newOutput = [
        ...output.filter((metadata) => metadata.key !== event.metadata.key),
        event.metadata,
      ];

      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (
      event.type === 'account_metadata_deleted' &&
      event.accountId === input.accountId
    ) {
      const newOutput = output.filter(
        (metadata) => metadata.key !== event.metadata.key
      );

      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async getAccountMetadata(
    accountId: string
  ): Promise<SelectAccountMetadata[] | undefined> {
    const account = appService.getAccount(accountId);

    if (!account) {
      return undefined;
    }

    const rows = await account.database
      .selectFrom('metadata')
      .selectAll()
      .execute();

    return rows;
  }
}
