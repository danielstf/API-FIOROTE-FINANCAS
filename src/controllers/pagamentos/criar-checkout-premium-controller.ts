import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { env } from "../../env";
import { MercadoPagoRequestError } from "../../lib/mercadopago";
import {
  CriarCheckoutPremiumUseCase,
  MercadoPagoPayerIncompativelError,
  UsuarioJaPremiumError,
  UsuarioNaoEncontradoError,
} from "../../use-cases/pagamentos/criar-checkout-premium-usecase";

const criarCheckoutPremiumBodySchema = z.object({
  tipo: z.literal("RECORRENTE").optional().default("RECORRENTE"),
});

export async function criarCheckoutPremiumController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { tipo } = criarCheckoutPremiumBodySchema.parse(request.body ?? {});

    // Caso de uso que cria a preferencia de pagamento premium no Mercado Pago.
    const criarCheckoutPremium = new CriarCheckoutPremiumUseCase();

    // Dados de ambiente definem URLs de retorno/notificacao e valor do plano.
    const checkout = await criarCheckoutPremium.execute({
      usuarioId: request.user.sub,
      appUrl: env.APP_URL,
      frontendUrl: env.FRONTEND_URL,
      tipo,
      premiumRecurringPrice: env.PREMIUM_RECURRING_PRICE,
      mercadoPagoAccessToken: env.MERCADO_PAGO_ACCESS_TOKEN,
      mercadoPagoPayerEmail: env.MERCADO_PAGO_PAYER_EMAIL,
      mercadoPagoPreapprovalPlanId: env.MERCADO_PAGO_PREAPPROVAL_PLAN_ID,
    });

    return reply.status(201).send(checkout);
  } catch (error) {
    // O checkout so pode ser criado para usuarios existentes.
    if (error instanceof UsuarioNaoEncontradoError) {
      return reply.status(404).send({ message: error.message });
    }

    // Evita gerar nova cobranca para quem ja possui premium ativo.
    if (error instanceof UsuarioJaPremiumError) {
      return reply.status(409).send({ message: error.message });
    }

    if (error instanceof MercadoPagoPayerIncompativelError) {
      return reply.status(400).send({ message: error.message });
    }

    if (error instanceof MercadoPagoRequestError) {
      console.error(
        `Erro MercadoPago ao criar checkout [${error.statusCode}]:`,
        error.responseBody,
      );

      if (
        error.statusCode === 403 &&
        error.responseBody.includes("PA_UNAUTHORIZED_RESULT_FROM_POLICIES")
      ) {
        return reply.status(503).send({
          message:
            "O recurso de assinaturas nao esta habilitado nesta conta do Mercado Pago. Ative em: Seu negocio → Assinaturas.",
        });
      }

      if (
        error.statusCode === 400 &&
        error.responseBody.includes("Both payer and collector must be real or test users")
      ) {
        return reply.status(400).send({
          message:
            "As credenciais e o usuario do Mercado Pago precisam ser ambos de teste ou ambos reais.",
        });
      }

      return reply.status(502).send({
        message: "Erro ao se comunicar com o Mercado Pago",
        detail: error.responseBody,
      });
    }

    console.error("Erro inesperado ao criar checkout premium:", error);
    return reply.status(500).send({ message: "Erro ao criar checkout premium" });
  }
}
