import { fileService } from '@/main/services/file-service';
import { JobHandler } from '@/main/jobs';

export type DownloadFilesInput = {
  type: 'download_files';
  userId: string;
};

declare module '@/main/jobs' {
  interface JobMap {
    download_files: {
      input: DownloadFilesInput;
    };
  }
}

export class DownloadFilesJobHandler implements JobHandler<DownloadFilesInput> {
  public triggerDebounce = 0;
  public interval = 1000 * 60;

  public async handleJob(input: DownloadFilesInput) {
    await fileService.downloadFiles(input.userId);
  }
}
