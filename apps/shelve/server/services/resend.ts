import { CreateEmailOptions, Resend } from 'resend'
import nodemailer from 'nodemailer'
import { render } from '@vue-email/render'
import type { H3Event } from 'h3'
import welcomeEmail from '~~/server/emails/welcomeEmail.vue'
import verifyOtp from '~~/server/emails/verifyOtp.vue'
import teamInvitation from '~~/server/emails/teamInvitation.vue'

export class EmailService {

  private readonly resend: Resend | null = null
  private readonly transporter: nodemailer.Transporter | null = null
  private readonly SENDER: string

  constructor(event: H3Event) {
    const config = useRuntimeConfig(event)
    if (config.private.resendApiKey) {
      this.resend = new Resend(config.private.resendApiKey)
    } else if (config.private.smtp?.host) {
      this.transporter = nodemailer.createTransport({
        host: config.private.smtp.host,
        port: Number(config.private.smtp.port || 587),
        secure: Number(config.private.smtp.port) === 465,
        auth: {
          user: config.private.smtp.user,
          pass: config.private.smtp.pass,
        },
      })
    }

    this.SENDER = config.private.senderEmail || 'HugoRCD <contact@hrcd.fr>'
  }

  async sendOtp(
    email: string,
    otp: string,
    redirectUrl: string
  ): Promise<void> {
    if (!this.resend) {
      console.warn(
        'Resend API key not found, set NUXT_PRIVATE_RESEND_API_KEY in your environment variables to enable email sending'
      )
      console.log('Development mode: OTP code is', otp)
      return
    }

    const template = await this.generateOtpTemplate(otp, redirectUrl)

    try {
      await this.sendMail({
        from: this.SENDER,
        to: [email],
        subject: 'Your Shelve Login Code',
        html: template,
      })
        .then(() => {
          console.log('OTP email sent')
        })
    } catch (error) {
      console.log('Error sending OTP email: ', error)
      throw error
    }
  }

  async sendWelcomeEmail(
    email: string,
    username: string,
    appUrl: string
  ): Promise<void> {
    if (!this.resend) {
      console.warn(
        'Resend API key not found, set NUXT_PRIVATE_RESEND_API_KEY in your environment variables to enable email sending'
      )
      return
    }
    const template = await this.generateWelcomeTemplate(username, appUrl)

    try {
      await this.sendMail({
        from: this.SENDER,
        to: [email],
        subject: 'Welcome to Shelve!',
        html: template,
      })
        .then(() => {
          console.log('Welcome email sent')
        })
      await this.sendMail({
        from: this.SENDER,
        to: ['contact@shelve.cloud'],
        subject: 'New user registered',
        html: `New user registered: ${username} - ${email}`,
      })
        .then(() => {
          console.log('New user email sent')
        })
    } catch (error) {
      console.log('Error sending welcome email: ', error)
    }
  }

  private async generateOtpTemplate(
    otp: string,
    redirectUrl: string
  ): Promise<string> {
    try {
      return await render(verifyOtp, {
        otp,
        redirectUrl,
      })
    } catch (error) {
      console.error(error)
      return `<h1>OTP: ${otp}</h1>`
    }
  }

  private async generateWelcomeTemplate(
    username: string,
    appUrl: string
  ): Promise<string> {
    try {
      return await render(welcomeEmail, {
        name: username,
      })
    } catch (error) {
      console.error(error)
      return `<h1>Welcome to Shelve, ${username}!</h1>`
    }
  }

  async sendInvitationEmail(options: {
    email: string;
    teamName: string;
    inviterName: string;
    role: string;
    inviteUrl: string;
  }): Promise<void> {
    const { email, teamName, inviterName, role, inviteUrl } = options

    if (!this.resend) {
      console.warn(
        'Resend API key not found, set NUXT_PRIVATE_RESEND_API_KEY in your environment variables to enable email sending'
      )
      console.log('Development mode: Invitation URL is', inviteUrl)
      return
    }

    const template = await this.generateInvitationTemplate(
      teamName,
      inviterName,
      role,
      inviteUrl
    )

    try {
      const payload = {
        from: this.SENDER,
        to: [email],
        subject: `You've been invited to join ${teamName} on Shelve`,
        html: template,
      }
      
      await this.sendMail(payload)
      console.log('Invitation email sent to', email)
    } catch (error) {
      console.log('Error sending invitation email: ', error)
      throw error
    }
  }

  private async generateInvitationTemplate(
    teamName: string,
    inviterName: string,
    role: string,
    inviteUrl: string
  ): Promise<string> {
    try {
      return await render(teamInvitation, {
        teamName,
        inviterName,
        role,
        inviteUrl,
      })
    } catch (error) {
      return `<h1>You've been invited to join ${teamName} on Shelve</h1><p><a href="${inviteUrl}">Accept Invitation</a></p>`
    }
  }


  private async sendMail(payload: CreateEmailOptions) {
    if (this.resend) {
      await this.resend.emails.send(payload)
    } else if (this.transporter) {
      await this.transporter.sendMail(payload)
    } else {
      console.warn(
        'No email provider configured. Set either NUXT_PRIVATE_RESEND_API_KEY or SMTP credentials.',
        payload
      )
    }
  }

}
