import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeListarReceitasFactory } from "../../factory/receitas-factory/listar-receitas-factory";
import { MesReceitaInvalidoError } from "../../use-cases/receitas/receita-mes";

const listarReceitasQuerySchema = z.object({
  // Filtro opcional no formato YYYY-MM, por exemplo: 2026-05.
  mes: z.string().trim().optional(),
});

export async function listarReceitasController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { mes } = listarReceitasQuerySchema.parse(request.query);

  try {
    const listarReceitas = makeListarReceitasFactory();

    const resultado = await listarReceitas.execute({
      usuarioId: request.user.sub,
      mes,
    });

    return reply.status(200).send(resultado);
  } catch (error) {
    if (error instanceof MesReceitaInvalidoError) {
      return reply.status(400).send({ message: error.message });
    }

    console.error("Erro ao listar receitas:", error);
    return reply.status(500).send({ message: "Erro ao listar receitas" });
  }
}
