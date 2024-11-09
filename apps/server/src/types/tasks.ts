import { EmailMessage } from './email';

export type Task = CleanDeviceDataTask | SendEmailTask;

export type CleanDeviceDataTask = {
  type: 'clean_device_data';
  deviceId: string;
};

export type SendEmailTask = {
  type: 'send_email';
  message: EmailMessage;
};