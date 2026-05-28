import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { env } from "../env";

export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: env.MERCADO_PAGO_ACCESS_TOKEN,
});

export const mercadoPagoPreference = new Preference(mercadoPagoClient);
export const mercadoPagoPayment = new Payment(mercadoPagoClient);

type PreapprovalPayload = {
  preapproval_plan_id?: string;
  reason?: string;
  external_reference: string;
  payer_email: string;
  back_url: string;
  notification_url: string;
  status: "pending" | "authorized" | "paused" | "canceled";
  auto_recurring?: {
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

export class MercadoPagoRequestError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly responseBody: string,
  ) {
    super(`Mercado Pago retornou ${statusCode}: ${responseBody}`);
  }
}

async function mercadoPagoRequest<T>(
  path: string,
  options: RequestInit = {},
  token = env.MERCADO_PAGO_ACCESS_TOKEN,
): Promise<T> {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new MercadoPagoRequestError(response.status, body);
  }

  return response.json() as Promise<T>;
}

// Usa MERCADO_PAGO_SUBSCRIPTION_TOKEN se configurado, senão cai no token principal.
const subscriptionToken = () =>
  env.MERCADO_PAGO_SUBSCRIPTION_TOKEN ?? env.MERCADO_PAGO_ACCESS_TOKEN;

export const mercadoPagoPreapproval = {
  create(body: PreapprovalPayload) {
    return mercadoPagoRequest<MercadoPagoPreapprovalResponse>(
      "/preapproval",
      { method: "POST", body: JSON.stringify(body) },
      subscriptionToken(),
    );
  },

  get(id: string) {
    return mercadoPagoRequest<MercadoPagoPreapprovalResponse>(
      `/preapproval/${id}`,
      {},
      subscriptionToken(),
    );
  },

  cancel(id: string) {
    return mercadoPagoRequest<MercadoPagoPreapprovalResponse>(
      `/preapproval/${id}`,
      { method: "PUT", body: JSON.stringify({ status: "canceled" }) },
      subscriptionToken(),
    );
  },
};
