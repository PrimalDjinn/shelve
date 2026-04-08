import { Resend } from 'resend'
import { getDefaultFromAddress, parseEmailProviderConfig, type ResendConfig } from '../config'
import type { EmailAttachment, EmailMessage, EmailProvider, EmailResult } from '../types'

function mapAttachment(attachment: EmailAttachment) {
  return {
    filename: attachment.filename || `attachment-${Date.now()}`,
    ...(attachment.content ? { content: attachment.content.toString("base64") } : {}),
    ...(attachment.path ? { path: attachment.path } : {}),
    ...(attachment.contentType ? { contentType: attachment.contentType } : {}),
  }
}

export class ResendProvider implements EmailProvider {

  readonly name = 'resend'
  private client: Resend
  private config: ResendConfig

  constructor() {
    this.config = parseEmailProviderConfig('resend')
    this.client = new Resend(this.config.RESEND_API_KEY)
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    try {
      const { data, error } = await this.client.emails.send({
        from: message.from || getDefaultFromAddress(this.config),
        to: message.to,
        subject: message.subject || '',
        ...(message.html ? { html: message.html } : { text: message.text || '' }),
        ...(message.attachments?.length
          ? {
            attachments: message.attachments.map(mapAttachment),
          }
          : {}),
      })

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: true,
        messageId: data?.id,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

}
