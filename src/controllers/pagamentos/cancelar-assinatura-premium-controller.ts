import { FastifyReply, FastifyRequest } from "fastify";
import {
  AssinaturaPremiumNaoEncontradaError,
  CancelarAssinaturaPremiumUseCase,
} from "../../use-cases/pagamentos/cancelar-assinatura-premium-usecase";

export async function cancelarAssinaturaPremiumController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const cancelarAssinaturaPremium = new CancelarAssinaturaPremiumUseCase();

    const resultado = await cancelarAssinaturaPremium.execute({
      usuarioId: request.user.sub,
    });

    return reply.status(200).send(resultado);
  } catch (error) {
    if (error instanceof AssinaturaPremiumNaoEncontradaError) {
      return reply.status(404).send({ message: error.message });
    }

    console.error("Erro ao cancelar assinatura premium:", error);
    return reply.status(500).send({ message: "Erro ao cancelar assinatura premium" });
  }
}
