import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  AtivarGooglePlayUseCase,
  CompraGooglePlayNaoValidadaError,
  RevenueCatNaoConfiguradoError,
} from "../../use-cases/pagamentos/ativar-google-play-usecase";

const bodySchema = z.object({
  revenuecatUserId: z.string().min(1),
});

export async function ativarGooglePlayController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { revenuecatUserId } = bodySchema.parse(request.body);
    const useCase = new AtivarGooglePlayUseCase();

    const resultado = await useCase.execute({
      usuarioId: request.user.sub,
      revenuecatUserId,
    });

    return reply.status(200).send(resultado);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ message: "Dados inválidos.", issues: error.issues });
    }

    if (error instanceof CompraGooglePlayNaoValidadaError) {
      return reply.status(402).send({ message: error.message });
    }

    if (error instanceof RevenueCatNaoConfiguradoError) {
      return reply.status(503).send({ message: error.message });
    }

    console.error("Erro ao ativar Google Play:", error);
    return reply.status(500).send({ message: "Erro ao ativar premium via Google Play." });
  }
}
