import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { env } from "../../env";
import {
  CriarCheckoutPremiumUseCase,
  MercadoPagoPayerIncompativelError,
  UsuarioJaPremiumError,
  UsuarioNaoEncontradoError,
} from "../../use-cases/pagamentos/criar-checkout-premium-usecase";

const criarCheckoutPremiumBodySchema = z.object({
  tipo: z.enum(["MENSAL", "RECORRENTE"]).optional().default("RECORRENTE"),
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
      premiumMonthlyPrice: env.PREMIUM_MONTHLY_PRICE,
      premiumRecurringPrice: env.PREMIUM_RECURRING_PRICE,
      mercadoPagoAccessToken: env.MERCADO_PAGO_ACCESS_TOKEN,
      mercadoPagoPayerEmail: env.MERCADO_PAGO_PAYER_EMAIL,
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

    // Falhas nao previstas nao expõem detalhes internos ao cliente.
    console.error("Erro ao criar checkout premium:", error);
    return reply.status(500).send({ message: "Erro ao criar checkout premium" });
  }
}
