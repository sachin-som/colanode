export type AccountVerifyOtpAttributes = {
  accountId: string;
  attempts: number;
};

export type AccountPasswordResetOtpAttributes = {
  accountId: string;
  attempts: number;
};

export type Otp<T> = {
  id: string;
  expiresAt: Date;
  otp: string;
  attributes: T;
};
