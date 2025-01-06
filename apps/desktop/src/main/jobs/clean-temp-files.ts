import { fileService } from '@/main/services/file-service';
import { JobHandler } from '@/main/jobs';

export type CleanTempFilesInput = {
  type: 'clean_temp_files';
  userId: string;
};

declare module '@/main/jobs' {
  interface JobMap {
    clean_temp_files: {
      input: CleanTempFilesInput;
    };
  }
}

export class CleanTempFilesJobHandler
  implements JobHandler<CleanTempFilesInput>
{
  public triggerDebounce = 1000;
  public interval = 1000 * 60 * 30;

  public async handleJob(input: CleanTempFilesInput) {
    await fileService.cleanTempFiles(input.userId);
  }
}
