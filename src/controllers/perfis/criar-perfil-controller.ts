import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeCriarPerfilFactory } from "../../factory/perfis-factory";
import { LimitePerfisError, PlanoPremiumObrigatorioError } from "../../use-cases/perfis/perfil-erros";

const bodySchema = z.object({
  nome: z.string().trim().min(1),
  avatar: z.string().trim().min(1).default("user"),
  tema: z.enum(["system", "light", "dark"]).default("system"),
});

export async function criarPerfilController(request: FastifyRequest, reply: FastifyReply) {
  const body = bodySchema.parse(request.body);
  try {
    const useCase = makeCriarPerfilFactory();
    const perfil = await useCase.execute({ usuarioId: request.user.sub, ...body });
    return reply.status(201).send(perfil);
  } catch (error) {
    if (error instanceof PlanoPremiumObrigatorioError) return reply.status(403).send({ message: error.message });
    if (error instanceof LimitePerfisError) return reply.status(409).send({ message: error.message });
    throw error;
  }
}