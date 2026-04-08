import mailchimpTransactional from "@mailchimp/mailchimp_transactional";
import {
  getDefaultFromAddress,
  parseEmailProviderConfig,
  type MailchimpConfig,
} from "../config";
import type {
  EmailAttachment,
  EmailMessage,
  EmailProvider,
  EmailResult,
} from "../types";

function mapRecipient(email: string) {
  return {
    email,
    type: "to" as const,
  };
}

function mapAttachment(attachment: EmailAttachment) {
  return {
    type: attachment.contentType || "application/octet-stream",
    name: attachment.filename || `attachment-${Date.now()}`,
    content: attachment.content?.toString("base64") || "",
  };
}

export class MailchimpProvider implements EmailProvider {
  readonly name = "mailchimp";
  private config: MailchimpConfig;
  private client: ReturnType<typeof mailchimpTransactional>;

  constructor() {
    this.config = parseEmailProviderConfig("mailchimp");
    this.client = mailchimpTransactional(
      this.config.MAILCHIMP_TRANSACTIONAL_API_KEY
    );
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    try {
      const recipients = Array.isArray(message.to)
        ? message.to.map(mapRecipient)
        : [mapRecipient(message.to)];
      const result = await this.client.messages.send({
        message: {
          from_email: message.from || getDefaultFromAddress(this.config),
          to: recipients,
          subject: message.subject || "",
          ...(message.html
            ? { html: message.html }
            : { text: message.text || "" }),
          ...(message.attachments?.length
            ? {
                attachments: message.attachments.map(mapAttachment),
              }
            : {}),
        },
      });

      if (!Array.isArray(result)) {
        return {
          success: false,
          error:
            result instanceof Error
              ? result.message
              : "Mailchimp did not return a delivery result",
        };
      }

      const firstResult = result[0];
      if (!firstResult) {
        return {
          success: false,
          error: "Mailchimp did not return a delivery result",
        };
      }

      if (
        firstResult.status &&
        ["rejected", "invalid"].includes(firstResult.status)
      ) {
        return {
          success: false,
          error:
            firstResult.reject_reason ||
            `Mailchimp delivery failed with status: ${firstResult.status}`,
        };
      }

      return {
        success: true,
        ...(firstResult._id ? { messageId: firstResult._id } : {}),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async verify(): Promise<boolean> {
    try {
      await this.client.users.ping({});
      return true;
    } catch {
      return false;
    }
  }
}
