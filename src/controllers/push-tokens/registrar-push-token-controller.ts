import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeRegistrarPushTokenFactory } from "../../factory/push-tokens-factory/registrar-push-token-factory";
import { UsuarioNaoEncontradoError } from "../../use-cases/push-tokens/registrar-push-token-usecase";

const bodySchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
});

export async function registrarPushTokenController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { token } = bodySchema.parse(request.body);

  try {
    const useCase = makeRegistrarPushTokenFactory();
    await useCase.execute({ usuarioId: request.user.sub, token });
    return reply.status(204).send();
  } catch (error) {
    if (error instanceof UsuarioNaoEncontradoError) {
      return reply.status(404).send({ message: error.message });
    }
    console.error("Erro ao registrar push token:", error);
    return reply.status(500).send({ message: "Erro ao registrar token de notificação" });
  }
}
