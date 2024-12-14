import { fileService } from '@/main/services/file-service';
import { JobHandler } from '@/main/jobs';

export type UploadFilesInput = {
  type: 'upload_files';
  userId: string;
};

declare module '@/main/jobs' {
  interface JobMap {
    upload_files: {
      input: UploadFilesInput;
    };
  }
}

export class UploadFilesJobHandler implements JobHandler<UploadFilesInput> {
  public triggerDebounce = 0;
  public interval = 1000 * 60;

  public async handleJob(input: UploadFilesInput) {
    await fileService.uploadFiles(input.userId);
  }
}
