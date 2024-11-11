import { EmailMessage } from '@/types/email';

export type Task =
  | CleanDeviceDataTask
  | SendEmailTask
  | CleanUserDeviceNodesTask;

export type CleanDeviceDataTask = {
  type: 'clean_device_data';
  deviceId: string;
};

export type SendEmailTask = {
  type: 'send_email';
  message: EmailMessage;
};

export type CleanUserDeviceNodesTask = {
  type: 'clean_user_device_nodes';
  userId: string;
  workspaceId: string;
};
