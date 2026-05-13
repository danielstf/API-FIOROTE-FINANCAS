import { FormaPagamentoDespesa } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeListarDespesasFactory } from "../../factory/despesas-factory/listar-despesas-factory";
import { MesReceitaInvalidoError } from "../../use-cases/receitas/receita-mes";

const booleanQuery = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    return value === true || value === "true";
  });

const listarDespesasQuerySchema = z.object({
  mes: z.string().trim().optional(),
  formaPagamento: z
    .enum(["DINHEIRO", "CARTAO_CREDITO"])
    .transform((value) => value as FormaPagamentoDespesa)
    .optional(),
  cartaoCreditoId: z.string().uuid("Id do cartao invalido").optional(),
  somenteCartao: booleanQuery,
  somenteVencidas: booleanQuery,
  paga: booleanQuery,
});

export async function listarDespesasController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const {
    mes,
    formaPagamento,
    cartaoCreditoId,
    somenteCartao,
    somenteVencidas,
    paga,
  } =
    listarDespesasQuerySchema.parse(request.query);

  try {
    const listarDespesas = makeListarDespesasFactory();

    const resultado = await listarDespesas.execute({
      usuarioId: request.user.sub,
      mes,
      formaPagamento,
      cartaoCreditoId,
      somenteCartao,
      somenteVencidas,
      paga,
    });

    return reply.status(200).send(resultado);
  } catch (error) {
    if (error instanceof MesReceitaInvalidoError) {
      return reply.status(400).send({ message: error.message });
    }

    console.error("Erro ao listar despesas:", error);
    return reply.status(500).send({ message: "Erro ao listar despesas" });
  }
}
