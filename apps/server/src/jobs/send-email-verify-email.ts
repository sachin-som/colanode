import { accountService } from '@/services/account-service';
import { JobHandler } from '@/types/jobs';

export type SendEmailVerifyEmailInput = {
  type: 'send_email_verify_email';
  otpId: string;
};

declare module '@/types/jobs' {
  interface JobMap {
    send_email_verify_email: {
      input: SendEmailVerifyEmailInput;
    };
  }
}

export const sendEmailVerifyEmailHandler: JobHandler<
  SendEmailVerifyEmailInput
> = async (input) => {
  const { otpId } = input;
  await accountService.sendEmailVerifyEmail(otpId);
};
