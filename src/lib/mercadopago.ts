import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { env } from "../env";

export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: env.MERCADO_PAGO_ACCESS_TOKEN,
});

export const mercadoPagoPreference = new Preference(mercadoPagoClient);
export const mercadoPagoPayment = new Payment(mercadoPagoClient);

type PreapprovalPayload = {
  reason: string;
  external_reference: string;
  payer_email: string;
  back_url: string;
  notification_url: string;
  status: "pending" | "authorized" | "paused" | "canceled";
  auto_recurring: {
    frequency: number;
    frequency_type: "days" | "months";
    transaction_amount: number;
    currency_id: "BRL";
  };
};

type MercadoPagoPreapprovalResponse = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
  status?: string;
  external_reference?: string;
  next_payment_date?: string;
};

async function mercadoPagoRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mercado Pago retornou ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

export const mercadoPagoPreapproval = {
  create(body: PreapprovalPayload) {
    return mercadoPagoRequest<MercadoPagoPreapprovalResponse>("/preapproval", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  get(id: string) {
    return mercadoPagoRequest<MercadoPagoPreapprovalResponse>(`/preapproval/${id}`);
  },

  cancel(id: string) {
    return mercadoPagoRequest<MercadoPagoPreapprovalResponse>(`/preapproval/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "canceled" }),
    });
  },
};
