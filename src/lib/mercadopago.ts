import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { env } from "../env";

export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: env.MERCADO_PAGO_ACCESS_TOKEN,
});

export const mercadoPagoPreference = new Preference(mercadoPagoClient);
export const mercadoPagoPayment = new Payment(mercadoPagoClient);
