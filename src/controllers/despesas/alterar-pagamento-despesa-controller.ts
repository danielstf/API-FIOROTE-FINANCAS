import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeAlterarPagamentoDespesaFactory } from "../../factory/despesas-factory/alterar-pagamento-despesa-factory";
import { DespesaNaoEncontradaError } from "../../use-cases/despesas/obter-despesa-usecase";

const alterarPagamentoParamsSchema = z.object({
  despesaId: z.string().uuid("Id da despesa invalido"),
});

const alterarPagamentoBodySchema = z.object({
  // Usado pelo clique no icone de pagamento realizado.
  paga: z.boolean(),
});

export async function alterarPagamentoDespesaController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { despesaId } = alterarPagamentoParamsSchema.parse(request.params);
  const { paga } = alterarPagamentoBodySchema.parse(request.body);

  try {
    const alterarPagamentoDespesa = makeAlterarPagamentoDespesaFactory();

    const despesa = await alterarPagamentoDespesa.execute({
      usuarioId: request.user.sub,
      despesaId,
      paga,
    });

    return reply.status(200).send(despesa);
  } catch (error) {
    if (error instanceof DespesaNaoEncontradaError) {
      return reply.status(404).send({ message: error.message });
    }

    console.error("Erro ao alterar pagamento da despesa:", error);
    return reply
      .status(500)
      .send({ message: "Erro ao alterar pagamento da despesa" });
  }
}
