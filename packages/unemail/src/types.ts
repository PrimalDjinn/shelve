export interface EmailAttachment {
  /** File name for the attachment */
  filename?: string | false | undefined;
  /** String or base64-encoded content */
  content?: string | Buffer;
  /** URL or file path to fetch content from */
  path?: string;
  /** MIME type, e.g. "text/calendar", "application/pdf" */
  contentType?: string;
  /** Content encoding, e.g. "base64" */
  encoding?: string;
}

export interface EmailMessage {
  from?: string;
  to: string | string[];
  subject?: string | undefined | null;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<EmailResult>;
  verify?(): Promise<boolean>;
}
