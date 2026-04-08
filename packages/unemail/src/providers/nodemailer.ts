import { createTransport, type Transporter } from 'nodemailer'
import { getDefaultFromAddress, parseEmailProviderConfig, type NodemailerConfig } from '../config'
import type { EmailProvider, EmailMessage, EmailResult } from '../types'

export class NodemailerProvider implements EmailProvider {

  readonly name = 'nodemailer'
  private transporter: Transporter
  private config: NodemailerConfig

  constructor() {
    this.config = parseEmailProviderConfig('nodemailer')
    this.transporter = createTransport({
      host: this.config.SMTP_HOST,
      port: this.config.SMTP_PORT,
      secure: this.config.SMTP_PORT === 465,
      auth: {
        user: this.config.SMTP_USER,
        pass: this.config.SMTP_PASS,
      },
    })
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    try {
      const result = await this.transporter.sendMail({
        from: message.from || getDefaultFromAddress(this.config),
        to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
        subject: message.subject || '',
        ...(message.html ? { html: message.html } : { text: message.text }),
        ...(message.attachments?.length ? { attachments: message.attachments } : {}),
      })

      return {
        success: true,
        messageId: result.messageId,
      }
    } catch (error) {
      return {
        success: false,
        error: String(error),
      }
    }
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify()
      return true
    } catch {
      return false
    }
  }

}
