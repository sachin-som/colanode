import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { getFileMetadata } from '@/main/lib/utils';
import { FileMetadataGetQueryInput } from '@/shared/queries/files/file-metadata-get';
import { Event } from '@/shared/types/events';
import { FileMetadata } from '@/shared/types/files';

export class FileMetadataGetQueryHandler
  implements QueryHandler<FileMetadataGetQueryInput>
{
  public async handleQuery(
    input: FileMetadataGetQueryInput
  ): Promise<FileMetadata | null> {
    const data = getFileMetadata(input.path);
    return data;
  }

  public async checkForChanges(
    _: Event,
    __: FileMetadataGetQueryInput,
    ___: FileMetadata | null
  ): Promise<ChangeCheckResult<FileMetadataGetQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
