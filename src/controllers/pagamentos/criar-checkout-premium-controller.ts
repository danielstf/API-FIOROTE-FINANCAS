import { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../env";
import {
  CriarCheckoutPremiumUseCase,
  UsuarioNaoEncontradoError,
} from "../../use-cases/pagamentos/criar-checkout-premium-usecase";

export async function criarCheckoutPremiumController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const criarCheckoutPremium = new CriarCheckoutPremiumUseCase();

    const checkout = await criarCheckoutPremium.execute({
      usuarioId: request.user.sub,
      appUrl: env.APP_URL,
      frontendUrl: env.FRONTEND_URL,
      premiumPrice: env.PREMIUM_PRICE,
    });

    return reply.status(201).send(checkout);
  } catch (error) {
    if (error instanceof UsuarioNaoEncontradoError) {
      return reply.status(404).send({ message: error.message });
    }

    console.error("Erro ao criar checkout premium:", error);
    return reply.status(500).send({ message: "Erro ao criar checkout premium" });
  }
}
