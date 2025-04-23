import { sendEmailPasswordResetEmail } from '@/lib/accounts';
import { JobHandler } from '@/types/jobs';

export type SendEmailPasswordResetEmailInput = {
  type: 'send_email_password_reset_email';
  otpId: string;
};

declare module '@/types/jobs' {
  interface JobMap {
    send_email_password_reset_email: {
      input: SendEmailPasswordResetEmailInput;
    };
  }
}

export const sendEmailPasswordResetEmailHandler: JobHandler<
  SendEmailPasswordResetEmailInput
> = async (input) => {
  const { otpId } = input;
  await sendEmailPasswordResetEmail(otpId);
};
