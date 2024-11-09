export interface EmailConfig {
    from: string;
    smtp?: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    };
}

export interface EmailMessage {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
}