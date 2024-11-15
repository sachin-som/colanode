import { CommandHandler } from '@/main/types';
import { FileOpenCommandInput } from '@/shared/commands/file-open';
import { fileService } from '@/main/services/file-service';

export class FileOpenCommandHandler
  implements CommandHandler<FileOpenCommandInput>
{
  public async handleCommand(input: FileOpenCommandInput): Promise<void> {
    fileService.openFile(input.userId, input.fileId, input.extension);
  }
}
