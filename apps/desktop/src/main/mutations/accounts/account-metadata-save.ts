import { MutationHandler } from '@/main/lib/types';
import { eventBus } from '@/shared/lib/event-bus';
import { mapAccountMetadata } from '@/main/lib/mappers';
import { appService } from '@/main/services/app-service';
import {
  AccountMetadataSaveMutationInput,
  AccountMetadataSaveMutationOutput,
} from '@/shared/mutations/accounts/account-metadata-save';

export class AccountMetadataSaveMutationHandler
  implements MutationHandler<AccountMetadataSaveMutationInput>
{
  async handleMutation(
    input: AccountMetadataSaveMutationInput
  ): Promise<AccountMetadataSaveMutationOutput> {
    const account = appService.getAccount(input.accountId);

    if (!account) {
      return {
        success: false,
      };
    }

    const createdMetadata = await account.database
      .insertInto('metadata')
      .returningAll()
      .values({
        key: input.key,
        value: JSON.stringify(input.value),
        created_at: new Date().toISOString(),
      })
      .onConflict((cb) =>
        cb.columns(['key']).doUpdateSet({
          value: JSON.stringify(input.value),
          updated_at: new Date().toISOString(),
        })
      )
      .executeTakeFirst();

    if (!createdMetadata) {
      return {
        success: false,
      };
    }

    eventBus.publish({
      type: 'account_metadata_saved',
      accountId: input.accountId,
      metadata: mapAccountMetadata(createdMetadata),
    });

    return {
      success: true,
    };
  }
}
