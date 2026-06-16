import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { AtivarGooglePlayUseCase } from "../../use-cases/pagamentos/ativar-google-play-usecase";

const bodySchema = z.object({
  purchaseToken: z.string(),
  productId: z.string(),
  tipo: z.enum(["RECORRENTE", "AVULSO"]),
  revenuecatUserId: z.string().optional(),
});

export async function ativarGooglePlayController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const body = bodySchema.parse(request.body);
    const useCase = new AtivarGooglePlayUseCase();

    const resultado = await useCase.execute({
      usuarioId: request.user.sub,
      ...body,
    });

    return reply.status(200).send(resultado);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ message: "Dados inválidos.", errors: error.flatten() });
    }

    console.error("Erro ao ativar Google Play:", error);
    return reply.status(500).send({ message: "Erro ao ativar premium via Google Play." });
  }
}
