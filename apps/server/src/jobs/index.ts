import { cleanNodeDataHandler } from '@/jobs/clean-node-data';
import { cleanWorkspaceDataHandler } from '@/jobs/clean-workspace-data';
import { JobHandler, JobMap } from '@/types/jobs';
import { sendEmailVerifyEmailHandler } from '@/jobs/send-email-verify-email';

type JobHandlerMap = {
  [K in keyof JobMap]: JobHandler<JobMap[K]['input']>;
};

export const jobHandlerMap: JobHandlerMap = {
  send_email_verify_email: sendEmailVerifyEmailHandler,
  clean_workspace_data: cleanWorkspaceDataHandler,
  clean_node_data: cleanNodeDataHandler,
};
