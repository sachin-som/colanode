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
      !configuration.email.host ||
      !configuration.email.port ||
      !configuration.email.user ||
      !configuration.email.password ||
      !configuration.email.from
    ) {
      throw new Error('SMTP configuration is missing');
    }

    this.transporter = nodemailer.createTransport({
      host: configuration.email.host,
      port: configuration.email.port,
      secure: true,
      auth: {
        user: configuration.email.user,
        pass: configuration.email.password,
      },
    });

    await this.transporter.verify();
  }

  public async sendEmail(message: EmailMessage): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    await this.transporter.sendMail({
      from: configuration.email.from,
      ...message,
    });
  }
}

export const emailService = new EmailService();
