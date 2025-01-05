import { cleanEntryDataHandler } from '@/jobs/clean-entry-data';
import { cleanWorkspaceDataHandler } from '@/jobs/clean-workspace-data';
import { JobHandler, JobMap } from '@/types/jobs';
import { embedMessageHandler } from '@/jobs/embed-message';
import { embedEntryHandler } from '@/jobs/embed-entry';
import { sendEmailVerifyEmailHandler } from '@/jobs/send-email-verify-email';

type JobHandlerMap = {
  [K in keyof JobMap]: JobHandler<JobMap[K]['input']>;
};

export const jobHandlerMap: JobHandlerMap = {
  send_email_verify_email: sendEmailVerifyEmailHandler,
  clean_workspace_data: cleanWorkspaceDataHandler,
  clean_entry_data: cleanEntryDataHandler,
  embed_message: embedMessageHandler,
  embed_entry: embedEntryHandler,
};
