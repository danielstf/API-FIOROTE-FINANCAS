import { FormaPagamentoDespesa } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeListarDespesasFactory } from "../../factory/despesas-factory/listar-despesas-factory";
import { getPerfilFinanceiroId } from "../../lib/perfil-financeiro";
import { bloquearRecursoPremiumSeNecessario } from "../../lib/premium-access";
import { booleanQuery } from "../../lib/query";
import { MesReceitaInvalidoError } from "../../use-cases/receitas/receita-mes";

const listarDespesasQuerySchema = z.object({
  mes: z.string().trim().optional(),
  formaPagamento: z
    .enum([
      "DINHEIRO",
      "CARTAO_CREDITO",
      "CARTAO_DEBITO",
      "VALE_ALIMENTACAO",
      "VALE_REFEICAO",
      "BOLETO",
    ])
    .transform((value) => value as FormaPagamentoDespesa)
    .optional(),
  cartaoCreditoId: z.string().uuid("Id do cartao invalido").optional(),
  somenteCartao: booleanQuery,
  somenteVencidas: booleanQuery,
  paga: booleanQuery,
  relatorio: booleanQuery,
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
    relatorio,
  } =
    listarDespesasQuerySchema.parse(request.query);

  try {
    if (
      await bloquearRecursoPremiumSeNecessario(
        request.user.sub,
        relatorio,
        reply,
      )
    ) {
      return;
    }

    const listarDespesas = makeListarDespesasFactory();

    const resultado = await listarDespesas.execute({
      usuarioId: request.user.sub,
      perfilFinanceiroId: getPerfilFinanceiroId(request),
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
