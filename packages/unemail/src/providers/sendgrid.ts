import sgMail from "@sendgrid/mail";
import {
  getDefaultFromAddress,
  parseEmailProviderConfig,
  type SendGridConfig,
} from "../config";
import type {
  EmailAttachment,
  EmailMessage,
  EmailProvider,
  EmailResult,
} from "../types";

function mapAttachment(attachment: EmailAttachment) {
  return {
    filename: attachment.filename || `attachment-${Date.now()}`,
    content: attachment.content?.toString("base64") || "",
    ...(attachment.contentType ? { type: attachment.contentType } : {}),
    disposition: "attachment",
  };
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const responseError = error as {
      message?: string;
      response?: {
        body?: {
          errors?: Array<{ message?: string }>;
        };
      };
    };

    const providerMessages = responseError.response?.body?.errors
      ?.map((item) => item.message)
      .filter((message): message is string => Boolean(message));

    if (providerMessages?.length) {
      return providerMessages.join("; ");
    }

    if (responseError.message) {
      return responseError.message;
    }
  }

  return String(error);
}

export class SendGridProvider implements EmailProvider {
  readonly name = "sendgrid";
  private config: SendGridConfig;

  constructor() {
    this.config = parseEmailProviderConfig("sendgrid");
    sgMail.setApiKey(this.config.SENDGRID_API_KEY);
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    try {
      const [response] = await sgMail.send({
        from: message.from || getDefaultFromAddress(this.config),
        to: message.to,
        subject: message.subject || "",
        ...(message.html
          ? { html: message.html }
          : { text: message.text || "" }),
        ...(message.attachments?.length
          ? {
              attachments: message.attachments.map(mapAttachment),
            }
          : {}),
      });

      const messageIdHeader =
        response.headers["x-message-id"] || response.headers["X-Message-Id"];
      const messageId = Array.isArray(messageIdHeader)
        ? messageIdHeader[0]
        : messageIdHeader;

      return {
        success: true,
        ...(messageId ? { messageId } : {}),
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }
}
