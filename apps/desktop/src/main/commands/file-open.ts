import path from 'path';
import { shell } from 'electron';

import { getWorkspaceFilesDirectoryPath } from '@/main/lib/utils';
import { CommandHandler } from '@/main/lib/types';
import { FileOpenCommandInput } from '@/shared/commands/file-open';

export class FileOpenCommandHandler
  implements CommandHandler<FileOpenCommandInput>
{
  public async handleCommand(input: FileOpenCommandInput): Promise<void> {
    const workspaceFilesDir = getWorkspaceFilesDirectoryPath(
      input.accountId,
      input.workspaceId
    );

    const filePath = path.join(
      workspaceFilesDir,
      `${input.fileId}${input.extension}`
    );

    shell.openPath(filePath);
  }
}
