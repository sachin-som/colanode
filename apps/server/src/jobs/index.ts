import { cleanEntryDataHandler } from '@/jobs/clean-entry-data';
import { cleanWorkspaceDataHandler } from '@/jobs/clean-workspace-data';
import { sendEmailHandler } from '@/jobs/send-email';
import { JobHandler, JobMap } from '@/types/jobs';
import { embedMessageHandler } from '@/jobs/embed-message';
import { embedEntryHandler } from '@/jobs/embed-entry';

type JobHandlerMap = {
  [K in keyof JobMap]: JobHandler<JobMap[K]['input']>;
};

export const jobHandlerMap: JobHandlerMap = {
  send_email: sendEmailHandler,
  clean_workspace_data: cleanWorkspaceDataHandler,
  clean_entry_data: cleanEntryDataHandler,
  embed_message: embedMessageHandler,
  embed_entry: embedEntryHandler,
};
