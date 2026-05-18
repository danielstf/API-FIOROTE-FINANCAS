import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeEditarPerfilFactory } from "../../factory/perfis-factory";
import { PerfilNaoEncontradoError } from "../../use-cases/perfis/perfil-erros";

const paramsSchema = z.object({ perfilId: z.string().uuid() });
const bodySchema = z.object({
  nome: z.string().trim().min(1).optional(),
  avatar: z.string().trim().min(1).optional(),
  tema: z.enum(["system", "light", "dark"]).optional(),
});

export async function editarPerfilController(request: FastifyRequest, reply: FastifyReply) {
  const { perfilId } = paramsSchema.parse(request.params);
  const body = bodySchema.parse(request.body);
  try {
    const useCase = makeEditarPerfilFactory();
    const perfil = await useCase.execute({ usuarioId: request.user.sub, perfilId, ...body });
    return reply.status(200).send(perfil);
  } catch (error) {
    if (error instanceof PerfilNaoEncontradoError) return reply.status(404).send({ message: error.message });
    throw error;
  }
}