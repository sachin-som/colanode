import nodemailer from 'nodemailer';
import { EmailConfig, EmailMessage } from '@/types/email';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
    throw new Error('SMTP configuration is missing');
}

let transporter: nodemailer.Transporter;

const emailConfig: EmailConfig = {
    from: EMAIL_FROM,
    smtp: {
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT),
        secure: true,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    },
};

export const initEmail = async () => {
    transporter = nodemailer.createTransport(emailConfig.smtp);
    await transporter.verify();
};

export const sendEmail = async (message: EmailMessage): Promise<void> => {
    if (!transporter) {
        throw new Error('Email service not initialized');
    }

    await transporter.sendMail({
        from: emailConfig.from,
        ...message,
    });
};