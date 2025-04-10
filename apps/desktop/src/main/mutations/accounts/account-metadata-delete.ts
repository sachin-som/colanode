import { MutationHandler } from '@/main/lib/types';
import { eventBus } from '@/shared/lib/event-bus';
import { mapAccountMetadata } from '@/main/lib/mappers';
import { appService } from '@/main/services/app-service';
import {
  AccountMetadataDeleteMutationInput,
  AccountMetadataDeleteMutationOutput,
} from '@/shared/mutations/accounts/account-metadata-delete';

export class AccountMetadataDeleteMutationHandler
  implements MutationHandler<AccountMetadataDeleteMutationInput>
{
  async handleMutation(
    input: AccountMetadataDeleteMutationInput
  ): Promise<AccountMetadataDeleteMutationOutput> {
    const account = appService.getAccount(input.accountId);

    if (!account) {
      return {
        success: false,
      };
    }

    const deletedMetadata = await account.database
      .deleteFrom('metadata')
      .where('key', '=', input.key)
      .returningAll()
      .executeTakeFirst();

    if (!deletedMetadata) {
      return {
        success: true,
      };
    }

    eventBus.publish({
      type: 'account_metadata_deleted',
      accountId: input.accountId,
      metadata: mapAccountMetadata(deletedMetadata),
    });

    return {
      success: true,
    };
  }
}
