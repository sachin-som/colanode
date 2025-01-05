export type RequestAccount = {
  id: string;
  deviceId: string;
};

export type OtpCodeData = {
  id: string;
  expiresAt: Date;
  accountId: string;
  otp: string;
  attempts: number;
};
