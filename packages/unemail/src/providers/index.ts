import type { EmailProvider } from "../types";
import { getSelectedEmailProviderName, providerNames } from "../config";
import { MailchimpProvider } from "./mailchimp";
import { NodemailerProvider } from "./nodemailer";
import { PostalProvider } from "./postal";
import { ResendProvider } from "./resend";
import { SendGridProvider } from "./sendgrid";

let _provider: { name: string; instance: EmailProvider } | null = null;
export type SmartString<T> = (T & string) | (string & {});
export function getEmailProvider(refresh?: boolean): EmailProvider;
export function getEmailProvider(
  name?: SmartString<(typeof providerNames)[number]>,
  refresh?: boolean
): EmailProvider;
export function getEmailProvider(
  arg?: boolean | string,
  refresh?: boolean
): EmailProvider {
  let providerName: string | undefined;
  if (typeof arg === "string" && arg) {
    providerName = arg;
    refresh = refresh ?? false;
  } else if (typeof arg === "boolean") {
    providerName = getSelectedEmailProviderName();
    refresh = arg;
  }

  if (_provider && _provider.name === providerName && !refresh) {
    return _provider.instance;
  }

  switch (providerName) {
    case "nodemailer":
      _provider = {
        name: providerName,
        instance: new NodemailerProvider(),
      };
      break;
    case "resend":
      _provider = {
        name: providerName,
        instance: new ResendProvider(),
      };
      break;
    case "sendgrid":
      _provider = {
        name: providerName,
        instance: new SendGridProvider(),
      };
      break;
    case "mailchimp":
      _provider = {
        name: providerName,
        instance: new MailchimpProvider(),
      };
      break;
    case "postal":
      _provider = {
        name: providerName,
        instance: new PostalProvider(),
      };
      break;
    // Add new providers here:
    default:
      throw new Error(
        `Unknown email provider: ${providerName}. Supported: nodemailer, resend, sendgrid, mailchimp, postal`
      );
  }

  return _provider.instance;
}
