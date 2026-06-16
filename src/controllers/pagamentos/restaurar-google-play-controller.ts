import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { RestaurarGooglePlayUseCase } from "../../use-cases/pagamentos/restaurar-google-play-usecase";

const bodySchema = z.object({
  revenuecatUserId: z.string(),
});

export async function restaurarGooglePlayController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const body = bodySchema.parse(request.body);
    const useCase = new RestaurarGooglePlayUseCase();

    const resultado = await useCase.execute({
      usuarioId: request.user.sub,
      ...body,
    });

    return reply.status(200).send(resultado);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ message: "Dados inválidos.", errors: error.flatten() });
    }

    console.error("Erro ao restaurar Google Play:", error);
    return reply.status(500).send({ message: "Erro ao restaurar premium via Google Play." });
  }
}
