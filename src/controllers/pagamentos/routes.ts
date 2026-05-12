import { FastifyInstance } from "fastify";
import { JWTVerify } from "../../middlewares/jwt-verify";
import { criarCheckoutPremiumController } from "./criar-checkout-premium-controller";
import { webhookMercadoPagoController } from "./webhook-mercado-pago-controller";

export function pagamentosRoutes(app: FastifyInstance) {
  app.post(
    "/pagamentos/premium/checkout",
    {
      preHandler: [JWTVerify],
    },
    criarCheckoutPremiumController,
  );

  app.post("/webhooks/mercado-pago", webhookMercadoPagoController);
}
