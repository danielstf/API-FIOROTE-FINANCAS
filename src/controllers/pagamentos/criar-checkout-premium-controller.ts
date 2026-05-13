import { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../env";
import {
  CriarCheckoutPremiumUseCase,
  UsuarioJaPremiumError,
  UsuarioNaoEncontradoError,
} from "../../use-cases/pagamentos/criar-checkout-premium-usecase";

export async function criarCheckoutPremiumController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    // Caso de uso que cria a preferencia de pagamento premium no Mercado Pago.
    const criarCheckoutPremium = new CriarCheckoutPremiumUseCase();

    // Dados de ambiente definem URLs de retorno/notificacao e valor do plano.
    const checkout = await criarCheckoutPremium.execute({
      usuarioId: request.user.sub,
      appUrl: env.APP_URL,
      frontendUrl: env.FRONTEND_URL,
      premiumPrice: env.PREMIUM_PRICE,
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

    // Falhas nao previstas nao expõem detalhes internos ao cliente.
    console.error("Erro ao criar checkout premium:", error);
    return reply.status(500).send({ message: "Erro ao criar checkout premium" });
  }
}
