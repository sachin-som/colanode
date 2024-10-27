export type Task = CleanDeviceDataTask;

export type CleanDeviceDataTask = {
  type: 'clean_device_data';
  deviceId: string;
};
