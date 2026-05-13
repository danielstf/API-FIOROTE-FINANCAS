import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeObterDespesaFactory } from "../../factory/despesas-factory/obter-despesa-factory";
import { DespesaNaoEncontradaError } from "../../use-cases/despesas/obter-despesa-usecase";

const obterDespesaParamsSchema = z.object({
  despesaId: z.string().uuid("Id da despesa invalido"),
});

export async function obterDespesaController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { despesaId } = obterDespesaParamsSchema.parse(request.params);

  try {
    const obterDespesa = makeObterDespesaFactory();

    const despesa = await obterDespesa.execute({
      usuarioId: request.user.sub,
      despesaId,
    });

    return reply.status(200).send(despesa);
  } catch (error) {
    if (error instanceof DespesaNaoEncontradaError) {
      return reply.status(404).send({ message: error.message });
    }

    console.error("Erro ao obter despesa:", error);
    return reply.status(500).send({ message: "Erro ao obter despesa" });
  }
}
