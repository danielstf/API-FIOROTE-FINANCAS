import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeExcluirDespesaFactory } from "../../factory/despesas-factory/excluir-despesa-factory";
import { DespesaNaoEncontradaError } from "../../use-cases/despesas/obter-despesa-usecase";

const excluirDespesaParamsSchema = z.object({
  despesaId: z.string().uuid("Id da despesa invalido"),
});

export async function excluirDespesaController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { despesaId } = excluirDespesaParamsSchema.parse(request.params);

  try {
    const excluirDespesa = makeExcluirDespesaFactory();

    await excluirDespesa.execute({
      usuarioId: request.user.sub,
      despesaId,
    });

    return reply.status(204).send();
  } catch (error) {
    if (error instanceof DespesaNaoEncontradaError) {
      return reply.status(404).send({ message: error.message });
    }

    console.error("Erro ao excluir despesa:", error);
    return reply.status(500).send({ message: "Erro ao excluir despesa" });
  }
}
