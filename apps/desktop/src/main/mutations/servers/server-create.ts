import { appService } from '@/main/services/app-service';
import { MutationHandler } from '@/main/lib/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  ServerCreateMutationInput,
  ServerCreateMutationOutput,
} from '@/shared/mutations/servers/server-create';

export class ServerCreateMutationHandler
  implements MutationHandler<ServerCreateMutationInput>
{
  async handleMutation(
    input: ServerCreateMutationInput
  ): Promise<ServerCreateMutationOutput> {
    const domain = parseDomain(input.domain);
    const server = await appService.createServer(domain);
    if (server === null) {
      throw new MutationError(
        MutationErrorCode.ServerInitFailed,
        'Could not fetch server configuration. Please make sure the domain is correct.'
      );
    }

    return {
      server: server.server,
    };
  }
}

const parseDomain = (domain: string): string => {
  try {
    const lowerCaseDomain = domain.toLowerCase();
    const urlString = lowerCaseDomain.startsWith('http')
      ? lowerCaseDomain
      : `http://${lowerCaseDomain}`;

    const url = new URL(urlString);
    return url.host; // host includes domain + port if present
  } catch {
    // If not a valid URL, treat as domain directly
    throw new MutationError(
      MutationErrorCode.ServerDomainInvalid,
      'The provided domain is not valid. Please make sure it is a valid server domain.'
    );
  }
};
