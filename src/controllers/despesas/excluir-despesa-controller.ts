import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeExcluirDespesaFactory } from "../../factory/despesas-factory/excluir-despesa-factory";
import { DespesaNaoEncontradaError } from "../../use-cases/despesas/obter-despesa-usecase";
import { MesReceitaInvalidoError } from "../../use-cases/receitas/receita-mes";

const excluirDespesaParamsSchema = z.object({
  despesaId: z.string().uuid("Id da despesa invalido"),
});

const excluirDespesaQuerySchema = z.object({
  escopo: z.enum(["mes", "todas"]).optional(),
  mes: z.string().trim().optional(),
  excluirParcelas: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export async function excluirDespesaController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { despesaId } = excluirDespesaParamsSchema.parse(request.params);
  const { escopo, mes, excluirParcelas } = excluirDespesaQuerySchema.parse(
    request.query,
  );

  try {
    const excluirDespesa = makeExcluirDespesaFactory();

    await excluirDespesa.execute({
      usuarioId: request.user.sub,
      despesaId,
      excluirParcelas,
      escopo,
      mes,
    });

    return reply.status(204).send();
  } catch (error) {
    if (error instanceof DespesaNaoEncontradaError) {
      return reply.status(404).send({ message: error.message });
    }

    if (error instanceof MesReceitaInvalidoError) {
      return reply.status(400).send({ message: error.message });
    }

    console.error("Erro ao excluir despesa:", error);
    return reply.status(500).send({ message: "Erro ao excluir despesa" });
  }
}
