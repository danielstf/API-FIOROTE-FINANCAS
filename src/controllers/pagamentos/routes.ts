import { FastifyInstance } from "fastify";
import { JWTVerify } from "../../middlewares/jwt-verify";
import { cancelarAssinaturaPremiumController } from "./cancelar-assinatura-premium-controller";
import { consultarPremiumController } from "./consultar-premium-controller";
import { criarCheckoutPremiumController } from "./criar-checkout-premium-controller";
import { webhookMercadoPagoController } from "./webhook-mercado-pago-controller";

export function pagamentosRoutes(app: FastifyInstance) {
  // Consulta o status premium do usuario autenticado.
  app.get(
    "/pagamentos/premium/status",
    {
      preHandler: [JWTVerify],
    },
    consultarPremiumController,
  );

  // Cria o checkout premium para o usuario autenticado.
  app.post(
    "/pagamentos/premium/checkout",
    {
      preHandler: [JWTVerify],
      config: {
        rateLimit: {
          max: 3,
          timeWindow: "15 minutes",
        },
      },
    },
    criarCheckoutPremiumController,
  );

  // Cancela a assinatura recorrente Premium do usuario autenticado.
  app.post(
    "/pagamentos/premium/cancelar",
    {
      preHandler: [JWTVerify],
      config: {
        rateLimit: {
          max: 3,
          timeWindow: "15 minutes",
        },
      },
    },
    cancelarAssinaturaPremiumController,
  );

  // Recebe notificacoes do Mercado Pago; nao usa JWT porque vem de sistema externo.
  app.post(
    "/webhooks/mercado-pago",
    {
      config: {
        rateLimit: {
          max: 60,
          timeWindow: "1 minute",
        },
      },
    },
    webhookMercadoPagoController,
  );
}
