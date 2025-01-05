import nodemailer from 'nodemailer';

import { configuration } from '@/lib/configuration';

interface EmailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | undefined;

  constructor() {}

  public async init() {
    if (
      !configuration.smtp.host ||
      !configuration.smtp.port ||
      !configuration.smtp.user ||
      !configuration.smtp.password ||
      !configuration.smtp.emailFrom
    ) {
      throw new Error('SMTP configuration is missing');
    }

    this.transporter = nodemailer.createTransport({
      host: configuration.smtp.host,
      port: configuration.smtp.port,
      secure: true,
      auth: {
        user: configuration.smtp.user,
        pass: configuration.smtp.password,
      },
    });

    await this.transporter.verify();
  }

  public async sendEmail(message: EmailMessage): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    await this.transporter.sendMail({
      from: configuration.smtp.emailFrom,
      ...message,
    });
  }
}

export const emailService = new EmailService();
