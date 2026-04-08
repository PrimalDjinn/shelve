import { readFile } from "node:fs/promises";
import { $fetch } from "ofetch";
import type { FetchError } from "ofetch";
import {
  getDefaultFromAddress,
  parseEmailProviderConfig,
  type PostalConfig,
} from "../config";
import type {
  EmailAttachment,
  EmailMessage,
  EmailProvider,
  EmailResult,
} from "../types";

type PostalResponse = {
  status?: string;
  data?: {
    message_id?: string;
    message?: string;
    error?: string;
    errors?: Record<string, string[]>;
  };
  message?: string;
  error?: string;
};

function getSendEndpoint(apiUrl: string): string {
  const trimmed = apiUrl.replace(/\/+$/, "");

  if (/\/api\/v1\/send\/message$/i.test(trimmed)) {
    return trimmed;
  }

  if (/\/api\/v1$/i.test(trimmed)) {
    return `${trimmed}/send/message`;
  }

  return `${trimmed}/api/v1/send/message`;
}

async function mapAttachment(attachment: EmailAttachment) {
  const data =
    attachment.content ||
    (attachment.path
      ? (await readFile(attachment.path)).toString("base64")
      : undefined);

  if (!data) {
    throw new Error(
      `Attachment "${attachment.filename}" is missing content or path`
    );
  }

  return {
    name: attachment.filename,
    data,
    ...(attachment.contentType ? { content_type: attachment.contentType } : {}),
  };
}

function getErrorMessage(
  payload: PostalResponse | null,
  response: Response
): string {
  const providerErrors = payload?.data?.errors
    ? Object.values(payload.data.errors)
        .flat()
        .filter((value): value is string => Boolean(value))
    : [];

  if (providerErrors.length) {
    return providerErrors.join("; ");
  }

  if (payload?.data?.error) {
    return payload.data.error;
  }

  if (payload?.data?.message) {
    return payload.data.message;
  }

  if (payload?.error) {
    return payload.error;
  }

  if (payload?.message) {
    return payload.message;
  }

  return `${response.status} ${response.statusText}`.trim();
}

export class PostalProvider implements EmailProvider {
  readonly name = "postal";
  private config: PostalConfig;
  private sendEndpoint: string;

  constructor() {
    this.config = parseEmailProviderConfig("postal");
    this.sendEndpoint = getSendEndpoint(this.config.POSTAL_API_URL);
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    try {
      const attachments = message.attachments?.length
        ? await Promise.all(
            message.attachments.map((attachment) => mapAttachment(attachment))
          )
        : undefined;

      const payload = await $fetch<PostalResponse>(this.sendEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Server-API-Key": this.config.POSTAL_SERVER_API_KEY,
        },
        body: {
          from: message.from || getDefaultFromAddress(this.config),
          to: Array.isArray(message.to) ? message.to : [message.to],
          subject: message.subject,
          ...(message.text ? { plain_body: message.text } : {}),
          ...(message.html ? { html_body: message.html } : {}),
          ...(attachments?.length ? { attachments } : {}),
        },
      }).catch((error) => {
        const { message, response } = error as FetchError;
        const errorMessage = response
          ? getErrorMessage(response._data as PostalResponse, response)
          : message || String(error);
        throw new Error(`Postal API request failed: ${errorMessage}`);
      });

      if (payload.status !== "success") {
        const errorMessage = getErrorMessage(
          payload,
          new Response("", { status: 500, statusText: "Internal Server Error" })
        );
        throw new Error(`Postal API responded with error: ${errorMessage}`);
      }

      return {
        success: true,
        ...(payload?.data?.message_id
          ? { messageId: payload.data.message_id }
          : {}),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
