import { env } from "../env";

type SendEmailParams = {
  to: string;
  toName?: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, toName, subject, html }: SendEmailParams) {
  const response = await fetch("https://api.zeptomail.in/v1.1/email", {
    method: "POST",
    headers: {
      Authorization: `Zoho-enczapikey ${env.ZEPTOMAIL_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      from: {
        address: env.ZEPTOMAIL_FROM_EMAIL,
        name: "Fiorote Finanças",
      },
      to: [
        {
          email_address: {
            address: to,
            ...(toName ? { name: toName } : {}),
          },
        },
      ],
      subject,
      htmlbody: html,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`ZeptoMail erro ${response.status}: ${JSON.stringify(body)}`);
  }

  return response.json();
}
