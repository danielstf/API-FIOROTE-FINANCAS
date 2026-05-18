import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeExcluirPerfilFactory } from "../../factory/perfis-factory";
import { PerfilNaoEncontradoError } from "../../use-cases/perfis/perfil-erros";

const paramsSchema = z.object({ perfilId: z.string().uuid() });

export async function excluirPerfilController(request: FastifyRequest, reply: FastifyReply) {
  const { perfilId } = paramsSchema.parse(request.params);
  try {
    const useCase = makeExcluirPerfilFactory();
    await useCase.execute(request.user.sub, perfilId);
    return reply.status(204).send();
  } catch (error) {
    if (error instanceof PerfilNaoEncontradoError) return reply.status(404).send({ message: error.message });
    throw error;
  }
}