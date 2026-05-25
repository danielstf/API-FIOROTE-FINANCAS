import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeExcluirReceitaFactory } from "../../factory/receitas-factory/excluir-receita-factory";
import { ReceitaNaoEncontradaError } from "../../use-cases/receitas/obter-receita-usecase";
import { MesReceitaInvalidoError, OperacaoEmMesPassadoError } from "../../use-cases/receitas/receita-mes";

const excluirReceitaParamsSchema = z.object({
  receitaId: z.string().uuid("Id da receita invalido"),
});

const excluirReceitaQuerySchema = z.object({
  escopo: z.enum(["mes", "todas"]).optional(),
  mes: z.string().trim().optional(),
});

export async function excluirReceitaController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { receitaId } = excluirReceitaParamsSchema.parse(request.params);
  const { escopo, mes } = excluirReceitaQuerySchema.parse(request.query);

  try {
    const excluirReceita = makeExcluirReceitaFactory();

    await excluirReceita.execute({
      usuarioId: request.user.sub,
      receitaId,
      escopo,
      mes,
    });

    return reply.status(204).send();
  } catch (error) {
    if (error instanceof ReceitaNaoEncontradaError) {
      return reply.status(404).send({ message: error.message });
    }

    if (error instanceof MesReceitaInvalidoError) {
      return reply.status(400).send({ message: error.message });
    }

    if (error instanceof OperacaoEmMesPassadoError) {
      return reply.status(400).send({ message: error.message });
    }

    console.error("Erro ao excluir receita:", error);
    return reply.status(500).send({ message: "Erro ao excluir receita" });
  }
}
