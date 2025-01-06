import { fileService } from '@/main/services/file-service';
import { JobHandler } from '@/main/jobs';

export type CleanDeletedFilesInput = {
  type: 'clean_deleted_files';
  userId: string;
};

declare module '@/main/jobs' {
  interface JobMap {
    clean_deleted_files: {
      input: CleanDeletedFilesInput;
    };
  }
}

export class CleanDeletedFilesJobHandler
  implements JobHandler<CleanDeletedFilesInput>
{
  public triggerDebounce = 1000;
  public interval = 1000 * 60 * 10;

  public async handleJob(input: CleanDeletedFilesInput) {
    await fileService.cleanDeletedFiles(input.userId);
  }
}
